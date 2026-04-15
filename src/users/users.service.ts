import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like } from "typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "../dtos/user/create-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll() {
    //user search in future
    return await this.userRepository.find();
  }

  async findUserById(id: string) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findUserByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async createUser(createUserDto: CreateUserDto) {
    const { email } = createUserDto;

    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new BadRequestException("User already exists");
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async getPublicKey(userId: string) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user.publicKey;
  }

  async emailSearch(query: string) {
    return this.userRepository.find({ where: { email: Like(`${query}%`) } });
  }
}
