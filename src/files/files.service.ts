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

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly minioService: MinioService,
  ) {}

  async findAll(userId: string) {
    return await this.fileRepository.find({
      where: { owner: { id: userId } },
      order: { createdAt: "DESC" },
    });
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
