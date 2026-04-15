import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotFoundException } from "@nestjs/common";
import { RegisterUserDto } from "../dtos/user/register-user.dto";
import { LoginUserDto } from "../dtos/user/login-user.dto";
import { User } from "../users/user.entity";

jest.mock("argon2", () => ({
  hash: jest.fn().mockResolvedValue("$argon2id$v=19$m=8192$hash"),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 2,
}));

import * as argon2 from "argon2";

describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    passwordHash: "hashed_password",
    publicKey: "public_key",
    encryptedPrivateKey: "encrypted_private_key",
    kdfSalt: "salt",
    iv: "iv",
    files: [],
  };

  beforeEach(async () => {
    const mockUsersService = {
      createUser: jest.fn(),
      findUserByEmail: jest.fn(),
      findAll: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    it("should successfully register a new user and return tokens", async () => {
      const registerDto: RegisterUserDto = {
        email: "test@example.com",
        password: "Password123",
        publicKey: "public_key",
        encryptedPrivateKey: "encrypted_private_key",
        kdfSalt: "salt",
        iv: "iv",
      };

      usersService.createUser.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue("jwt_token");

      const result = await service.register(registerDto);

      expect(argon2.hash).toHaveBeenCalledWith("Password123", {
        type: 2,
        memoryCost: 8192,
        timeCost: 2,
        parallelism: 1,
      });
      expect(usersService.createUser).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password123",
        publicKey: "public_key",
        encryptedPrivateKey: "encrypted_private_key",
        kdfSalt: "salt",
        iv: "iv",
        passwordHash: "$argon2id$v=19$m=8192$hash",
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: "1",
        email: "test@example.com",
      });
      expect(result).toEqual({ accessToken: "jwt_token" });
    });

    it("should hash password before creating user", async () => {
      const registerDto: RegisterUserDto = {
        email: "test@example.com",
        password: "Password123",
        publicKey: "public_key",
        encryptedPrivateKey: "encrypted_private_key",
        kdfSalt: "salt",
        iv: "iv",
      };

      usersService.createUser.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue("jwt_token");

      await service.register(registerDto);

      expect(argon2.hash).toHaveBeenCalledWith("Password123", {
        type: 2,
        memoryCost: 8192,
        timeCost: 2,
        parallelism: 1,
      });
      const createUserCall = usersService.createUser.mock.calls[0][0];
      expect(createUserCall.passwordHash).not.toBe("Password123");
      expect(createUserCall.passwordHash).toBe("$argon2id$v=19$m=8192$hash");
    });
  });

  describe("login", () => {
    it("should successfully login with valid credentials", async () => {
      const loginDto: LoginUserDto = {
        email: "test@example.com",
        password: "password123",
      };

      usersService.findUserByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue("jwt_token");

      const result = await service.login(loginDto);

      expect(argon2.verify).toHaveBeenCalledWith(
        "hashed_password",
        "password123",
      );
      expect(usersService.findUserByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: "1",
        email: "test@example.com",
      });
      expect(result).toEqual({ accessToken: "jwt_token" });
    });

    it("should throw NotFoundException if user does not exist", async () => {
      const loginDto: LoginUserDto = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      usersService.findUserByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
      await expect(service.login(loginDto)).rejects.toThrow(
        "User is not found",
      );
    });

    it("should verify password hash during login", async () => {
      const loginDto: LoginUserDto = {
        email: "test@example.com",
        password: "password123",
      };

      usersService.findUserByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue("jwt_token");

      await service.login(loginDto);

      expect(argon2.verify).toHaveBeenCalledWith(
        "hashed_password",
        "password123",
      );
      expect(usersService.findUserByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
    });
  });
});
