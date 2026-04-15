import { Controller, Post, Body, UseGuards, Get, Param, ParseUUIDPipe } from "@nestjs/common";
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
  async findOwnersFiles(@CurrentUser() user: AuthUser) {
    return await this.filesService.findFilesForOwner(user.id);
  }

  @Get("shared")
  async findSharedFiles(@CurrentUser() user: AuthUser) {
    return await this.filesService.findSharedFiles(user.id);
  }

  @UseGuards(FileOwnerGuard)
  @Post("share/:fileId")
  async shareFile(
    @CurrentUser() owner: AuthUser,
    @Body() body: { userId: string, encryptedFileKey: string },
    @Param("fileId", new ParseUUIDPipe()) fileId: string,
  ) {
    const { userId, encryptedFileKey } = body;
    return this.filesService.shareFile(userId, encryptedFileKey, fileId, owner.id);
  }
}
