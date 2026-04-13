import { IsString, IsNotEmpty } from "class-validator";
import { Expose } from "class-transformer";

export class UploadUrlResponseDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  uploadUrl: string;
}
