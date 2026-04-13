import { Expose, Exclude } from "class-transformer";

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  publicKey: string;

  @Expose()
  encryptedPrivateKey: string;

  @Expose()
  kdfSalt: string;

  @Expose()
  iv: string;

  @Exclude()
  passwordHash: string;
}
