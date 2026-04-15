import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtGuard } from "src/guards/jwt.guard";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtGuard)
  @Get(":userId/public-key")
  async getPublicKey(@Param("userId") userId: string) {
    return this.usersService.getPublicKey(userId);
  }
}
