import { Controller, Post, Body, UseGuards, Get, Param, ValidationPipe, ParseUUIDPipe } from "@nestjs/common";
import { FilesService } from "./files.service";
import { JwtGuard } from "../guards/jwt.guard";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { AuthUser } from "../auth/types/auth-user.type";
import { UploadRequestDto } from "../dtos/file/upload-request.dto";
import { TransformResponse } from "../decorators/transform-response.decorator";
import { UploadUrlResponseDto } from "../dtos/file/upload-url-response.dto";
import { FileOwnerGuard } from "src/guards/file-owner.guar";

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
  async findFiles(@CurrentUser() user: AuthUser) {
    return await this.filesService.findFiles(user.id);
  }

  @UseGuards(FileOwnerGuard)
  @Post("share/:fileId")
  async shareFile(
    @CurrentUser() owner: AuthUser,
    @Body() user: { userId: string },
    @Param("fileId", new ParseUUIDPipe()) fileId: string,
  ) {
    return this.filesService.shareFile(user.userId, fileId, owner.id);
  }
}
