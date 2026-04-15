import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { User } from "./user.entity";
import { CreateUserDto } from "../dtos/user/create-user.dto";

describe("UsersService", () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;

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

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return an array of users", async () => {
      const mockUsers = [mockUser];
      userRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(userRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it("should return empty array when no users exist", async () => {
      userRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findUserById", () => {
    it("should return user when found", async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserById("1");

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe("findUserByEmail", () => {
    it("should return user when found by email", async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserByEmail("test@example.com");

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found by email", async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findUserByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    it("should successfully create a new user", async () => {
      const createUserDto: CreateUserDto = {
        email: "new@example.com",
        passwordHash: "hashed_password",
        publicKey: "public_key",
        encryptedPrivateKey: "encrypted_private_key",
        kdfSalt: "salt",
        iv: "iv",
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: "new@example.com" },
      });
      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it("should throw BadRequestException when user already exists", async () => {
      const createUserDto: CreateUserDto = {
        email: "test@example.com",
        passwordHash: "hashed_password",
        publicKey: "public_key",
        encryptedPrivateKey: "encrypted_private_key",
        kdfSalt: "salt",
        iv: "iv",
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        "User already exists",
      );
    });

    it("should not create user if email already exists", async () => {
      const createUserDto: CreateUserDto = {
        email: "test@example.com",
        passwordHash: "hashed_password",
        publicKey: "public_key",
        encryptedPrivateKey: "encrypted_private_key",
        kdfSalt: "salt",
        iv: "iv",
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
});
