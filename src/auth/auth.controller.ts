import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterUserDto } from "../dtos/user/register-user.dto";
import { JwtGuard } from "../guards/jwt.guard";
import { TokenResponseDto } from "../dtos/user/token-response.dto";
import { TransformResponse } from "../decorators/transform-response.decorator";
import { UserResponseDto } from "../dtos/user/user-response.dto";
import { LoginUserDto } from "../dtos/user/login-user.dto";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { AuthUser } from "./types/auth-user.type";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @TransformResponse(TokenResponseDto)
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post("login")
  @TransformResponse(TokenResponseDto)
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @UseGuards(JwtGuard)
  @Get("profile")
  @TransformResponse(UserResponseDto)
  async getProfile(@CurrentUser() user: AuthUser) {
    return user;
  }
}
