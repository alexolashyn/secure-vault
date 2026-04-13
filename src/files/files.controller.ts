import { Controller, Post, Body, UseGuards, Get, Param } from "@nestjs/common";
import { FilesService } from "./files.service";
import { JwtGuard } from "../guards/jwt.guard";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { AuthUser } from "../auth/types/auth-user.type";
import { UploadRequestDto } from "../dtos/file/upload-request.dto";
import { TransformResponse } from "../decorators/transform-response.decorator";
import { UploadUrlResponseDto } from "../dtos/file/upload-url-response.dto";

@Controller("files")
@UseGuards(JwtGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload-request")
  @TransformResponse(UploadUrlResponseDto)
  async createUploadRequest(
    @Body() uploadRequestDto: UploadRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.filesService.createUploadRequest(
      user.id,
      uploadRequestDto,
    );
  }

  @Get("download-request/:id")
  async createDownloadRequest(
    @CurrentUser() user: AuthUser,
    @Param("id") fileId: string,
  ) {
    return await this.filesService.createDownloadRequest(user.id, fileId);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.filesService.findAll(user.id);
  }
}
