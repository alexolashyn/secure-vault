import { Expose } from "class-transformer";

export class TokenResponseDto {
  @Expose()
  accessToken: string;
}
