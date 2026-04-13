import { Module } from "@nestjs/common";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { MinioService } from "../minio/minio.service";
import { MinioModule } from "../minio/minio.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileEntity } from "./file.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), MinioModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
