import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FileEntity } from "./file.entity";
import { MinioService } from "../minio/minio.service";
import { v4 as uuidv4 } from "uuid";
import { UploadRequestDto } from "../dtos/file/upload-request.dto";
import { UsersService } from "../users/users.service";
import { FileShare } from "./file-share.entity";

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(FileShare)
    private readonly fileShareRepository: Repository<FileShare>,
    private readonly minioService: MinioService,
    private readonly usersService: UsersService,
  ) {}

  async findFileById(fileId: string) {
    return await this.fileRepository.findOne({ where: { id: fileId } });
  }

  async checkFileOwnership(userId: string, fileId: string) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, owner: { id: userId } },
    });

    return file;
  }

  async shareFile(
    userId: string,
    encryptedFileKey: string,
    fileId: string,
    ownerId: string,
  ) {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new NotFoundException("User is not found");
    }

    if (user.id === ownerId) {
      throw new BadRequestException("You cannot share a file with yourself");
    }

    const file = await this.findFileById(fileId);
    if (!file) {
      throw new NotFoundException("File is not found");
    }

    const existingShare = await this.fileShareRepository.findOne({
      where: {
        file: { id: fileId },
        user: { id: userId },
      },
    });
    if (existingShare) {
      throw new BadRequestException("File is already shared with this user");
    }

    const fileShare = this.fileShareRepository.create({
      encryptedFileKey,
      file: { id: fileId },
      user: { id: userId },
      sharedBy: { id: ownerId },
    });

    return await this.fileShareRepository.save(fileShare);
  }

  async findFilesForOwner(userId: string) {
    return await this.fileRepository.find({
      where: { owner: { id: userId } },
      order: { createdAt: "DESC" },
    });
  }

  async findSharedFiles(userId: string) {
    const sharedEntities = await this.fileShareRepository.find({
      where: { user: { id: userId } },
      relations: ["file"],
      order: { createdAt: "DESC" },
    });

    return sharedEntities.map((entity) => entity.file);
  }

  async createUploadRequest(
    userId: string,
    uploadRequestDto: UploadRequestDto,
  ) {
    const minioPath = uuidv4();
    const { name, encryptedFileKey, fileIv } = uploadRequestDto;

    try {
      const newFile = this.fileRepository.create({
        name,
        minioPath,
        owner: { id: userId },
        encryptedFileKey,
        fileIv,
        mimeType: uploadRequestDto?.mimeType,
        size: uploadRequestDto?.size,
      });

      const uploadUrl =
        await this.minioService.getPresignedUrlForUpload(minioPath);

      const savedFile = await this.fileRepository.save(newFile);
      return {
        fileId: savedFile.id,
        uploadUrl,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createDownloadRequest(userId: string, fileId: string) {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId },
      });
      if (!file) {
        throw new NotFoundException("File is not found");
      }

      const isSharedFile = await this.fileShareRepository.findOne({
        where: { file: { id: fileId }, user: { id: userId } },
      });

      return {
        downloadUrl: await this.minioService.getPresignedUrlForDownload(
          file.minioPath,
          file.name,
        ),
        file,
        sharedEncryptedFileKey: isSharedFile?.encryptedFileKey,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }
}
