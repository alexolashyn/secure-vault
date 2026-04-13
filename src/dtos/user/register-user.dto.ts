import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsNotEmpty,
} from "class-validator";

export class RegisterUserDto {
  @IsEmail({}, { message: "Invalid email." })
  email: string;

  @IsString()
  @MinLength(8, { message: "Password should be at least 8 characters." })
  @Matches(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter.",
  })
  @Matches(/[a-z]/, {
    message: "Password must contain at least one lowercase letter.",
  })
  @Matches(/\d/, { message: "Password must contain at least one number." })
  password: string;

  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @IsString()
  @IsNotEmpty()
  encryptedPrivateKey: string;

  @IsString()
  @IsNotEmpty()
  kdfSalt: string;

  @IsString()
  @IsNotEmpty()
  iv: string;
}
