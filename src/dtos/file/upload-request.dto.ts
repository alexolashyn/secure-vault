import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";

export class UploadRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  encryptedFileKey: string;

  @IsString()
  @IsNotEmpty()
  fileIv: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsNumber()
  @IsOptional()
  size?: number;
}
