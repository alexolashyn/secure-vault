import * as Minio from "minio";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MinioService {
  private minioClient: Minio.Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.getOrThrow("MINIO_ENDPOINT"),
      port: Number(this.configService.getOrThrow("MINIO_PORT")),
      useSSL: this.configService.getOrThrow("MINIO_USE_SSL") === "true",
      accessKey: this.configService.getOrThrow("MINIO_ACCESS_KEY"),
      secretKey: this.configService.getOrThrow("MINIO_SECRET_KEY"),
    });
    this.bucketName = this.configService.getOrThrow("MINIO_BUCKET_NAME");
  }

  async getPresignedUrlForUpload(minioPath: string): Promise<string> {
    try {
      return await this.minioClient.presignedPutObject(
        this.bucketName,
        minioPath,
        3600,
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getPresignedUrlForDownload(
    minioPath: string,
    fileName: string,
  ): Promise<string> {
    try {
      const respHeaders = {
        "response-content-disposition": `attachment; filename="${fileName}"`,
      };

      return await this.minioClient.presignedGetObject(
        this.bucketName,
        minioPath,
        3600,
        respHeaders,
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
