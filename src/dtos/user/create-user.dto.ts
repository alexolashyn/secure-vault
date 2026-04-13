import { RegisterUserDto } from './register-user.dto';

export type CreateUserDto = Omit<RegisterUserDto, 'password'> & {
  passwordHash: string;
};