import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { RegisterUserDto } from "../dtos/user/register-user.dto";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { LoginUserDto } from "../dtos/user/login-user.dto";
import { User } from "../users/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const passwordHash = await argon2.hash(registerUserDto.password, {
      type: argon2.argon2id,
      memoryCost: 8192,
      timeCost: 2,
      parallelism: 1,
    });

    const user = await this.usersService.createUser({
      ...registerUserDto,
      passwordHash,
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException("User is not found");
    }

    const isValidPassword = await argon2.verify(user.passwordHash, password);

    if (!isValidPassword) {
      throw new BadRequestException("Invalid password");
    }

    return this.generateTokens(user.id, user.email);
  }

  private async generateTokens(id: string, email: string) {
    const payload = { sub: id, email };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
    };
  }
}
