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

    @ InjectRepository(FileShare)
    private readonly fileShareRepository: Repository<FileShare>,

    private readonly minioService: MinioService,
    private readonly usersService: UsersService,
  ) { }

  async findFileById(fileId: string) {
    return await this.fileRepository.findOne({ where: { id: fileId } });
  }

  async checkFileOwnership(userId: string, fileId: string) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, owner: { id: userId } },
    });

    return file;
  }

  async shareFile(userId: string, fileId: string, ownerId: string) {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new NotFoundException("User is not found");
    }

    const file = await this.findFileById(fileId);
    if (!file) {
      throw new NotFoundException("File is not found");
    }

    const existingShare = await this.fileShareRepository.findOne({
      where: { 
        file: { id: fileId }, 
        user: { id: userId } 
      },
    });

    if (existingShare) {
      throw new BadRequestException("File is already shared with this user");
    }

    const fileShare = this.fileShareRepository.create({
      file: { id: fileId },
      user: { id: userId },
      sharedBy: { id: ownerId }
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
    return await this.fileShareRepository.find({
      where: { user: { id: userId } },
      relations: ["file", "file.owner"],
      order: { createdAt: "DESC" },
    });
  }

  async findFiles(userId: string) {
    const ownedFiles = await this.findFilesForOwner(userId);
    const sharedFiles = await this.findSharedFiles(userId);
    const sharedFileEntities = sharedFiles.map(share => share.file);
    return [...ownedFiles, ...sharedFileEntities];
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
        mimeType: uploadRequestDto.mimeType,
        size: uploadRequestDto.size,
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
        where: { id: fileId, owner: { id: userId } },
      });

      if (!file) {
        throw new NotFoundException("File is not found");
      }

      return {
        downloadUrl: await this.minioService.getPresignedUrlForDownload(
          file.minioPath,
          file.name,
        ),
        file,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }
}
