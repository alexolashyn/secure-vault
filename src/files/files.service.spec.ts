import { Test, TestingModule } from "@nestjs/testing";
import { FilesService } from "./files.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { FileEntity } from "./file.entity";
import { MinioService } from "../minio/minio.service";
import { UploadRequestDto } from "../dtos/file/upload-request.dto";
import { UsersService } from "../users/users.service";
import { FileShare } from "./file-share.entity";

describe("FilesService", () => {
  let service: FilesService;
  let fileRepository: jest.Mocked<Repository<FileEntity>>;
  let fileShareRepository: jest.Mocked<Repository<FileShare>>;
  let minioService: jest.Mocked<MinioService>;
  let usersService: jest.Mocked<UsersService>;

  const mockFile: FileEntity = {
    id: "1",
    name: "test.txt",
    minioPath: "uuid-path",
    encryptedFileKey: "encrypted_key",
    fileIv: "file_iv",
    mimeType: "text/plain",
    size: 1024,
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: {} as any,
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockFileShareRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMinioService = {
    getPresignedUrlForUpload: jest.fn(),
    getPresignedUrlForDownload: jest.fn(),
  };

  const mockUsersService = {
    findUserById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(FileEntity),
          useValue: mockRepository,
        },
        {
          provide: MinioService,
          useValue: mockMinioService,
        },
        {
          provide: getRepositoryToken(FileShare),
          useValue: mockFileShareRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    fileRepository = module.get(getRepositoryToken(FileEntity));
    fileShareRepository = module.get(getRepositoryToken(FileShare));
    minioService = module.get(MinioService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findFilesForOwner", () => {
    it("should return files for a specific user", async () => {
      const mockFiles = [mockFile];
      fileRepository.find.mockResolvedValue(mockFiles);

      const result = await service.findFilesForOwner("user-1");

      expect(fileRepository.find).toHaveBeenCalledWith({
        where: { owner: { id: "user-1" } },
        order: { createdAt: "DESC" },
      });
      expect(result).toEqual(mockFiles);
    });

    it("should return empty array when no files exist", async () => {
      fileRepository.find.mockResolvedValue([]);

      const result = await service.findFilesForOwner("user-1");

      expect(result).toEqual([]);
    });
  });

  describe("createUploadRequest", () => {
    it("should successfully create upload request", async () => {
      const uploadDto: UploadRequestDto = {
        name: "test.txt",
        encryptedFileKey: "encrypted_key",
        fileIv: "file_iv",
        mimeType: "text/plain",
        size: 1024,
      };

      fileRepository.create.mockReturnValue(mockFile);
      fileRepository.save.mockResolvedValue(mockFile);
      minioService.getPresignedUrlForUpload.mockResolvedValue("upload_url");

      const result = await service.createUploadRequest("user-1", uploadDto);

      expect(fileRepository.create).toHaveBeenCalledWith({
        name: "test.txt",
        minioPath: expect.any(String),
        owner: { id: "user-1" },
        encryptedFileKey: "encrypted_key",
        fileIv: "file_iv",
        mimeType: "text/plain",
        size: 1024,
      });
      expect(minioService.getPresignedUrlForUpload).toHaveBeenCalled();
      expect(fileRepository.save).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual({
        fileId: "1",
        uploadUrl: "upload_url",
      });
    });

    it("should throw BadRequestException on error", async () => {
      const uploadDto: UploadRequestDto = {
        name: "test.txt",
        encryptedFileKey: "encrypted_key",
        fileIv: "file_iv",
      };

      fileRepository.create.mockImplementation(() => {
        throw new Error("Database error");
      });

      await expect(
        service.createUploadRequest("user-1", uploadDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("createDownloadRequest", () => {
    it("should successfully create download request for owned file", async () => {
      fileRepository.findOne.mockResolvedValue(mockFile);
      minioService.getPresignedUrlForDownload.mockResolvedValue("download_url");

      const result = await service.createDownloadRequest("user-1", "file-1");

      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { id: "file-1" },
      });
      expect(minioService.getPresignedUrlForDownload).toHaveBeenCalledWith(
        "uuid-path",
        "test.txt",
      );
      expect(result).toEqual({
        downloadUrl: "download_url",
        file: mockFile,
        sharedEncryptedFileKey: undefined,
      });
    });

    it("should throw NotFoundException when file not found", async () => {
      fileRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createDownloadRequest("user-1", "file-999"),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createDownloadRequest("user-1", "file-999"),
      ).rejects.toThrow("File is not found");
    });

    it("should throw NotFoundException when file does not belong to user", async () => {
      fileRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createDownloadRequest("user-2", "file-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should successfully create download request for shared file", async () => {
      const mockFileShare = {
        id: "share-1",
        encryptedFileKey: "shared_key",
      } as any;
      fileRepository.findOne.mockResolvedValue(mockFile);
      fileShareRepository.findOne.mockResolvedValue(mockFileShare);
      minioService.getPresignedUrlForDownload.mockResolvedValue("download_url");

      const result = await service.createDownloadRequest("user-2", "file-1");

      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { id: "file-1" },
      });
      expect(fileShareRepository.findOne).toHaveBeenCalledWith({
        where: { file: { id: "file-1" }, user: { id: "user-2" } },
      });
      expect(minioService.getPresignedUrlForDownload).toHaveBeenCalledWith(
        "uuid-path",
        "test.txt",
      );
      expect(result).toEqual({
        downloadUrl: "download_url",
        file: mockFile,
        sharedEncryptedFileKey: "shared_key",
      });
    });
  });

  describe("findFileById", () => {
    it("should return file by id", async () => {
      fileRepository.findOne.mockResolvedValue(mockFile);

      const result = await service.findFileById("file-1");

      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { id: "file-1" },
      });
      expect(result).toEqual(mockFile);
    });

    it("should return null when file not found", async () => {
      fileRepository.findOne.mockResolvedValue(null);

      const result = await service.findFileById("file-999");

      expect(result).toBeNull();
    });
  });

  describe("checkFileOwnership", () => {
    it("should return file when user is owner", async () => {
      fileRepository.findOne.mockResolvedValue(mockFile);

      const result = await service.checkFileOwnership("user-1", "file-1");

      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { id: "file-1", owner: { id: "user-1" } },
      });
      expect(result).toEqual(mockFile);
    });

    it("should return null when user is not owner", async () => {
      fileRepository.findOne.mockResolvedValue(null);

      const result = await service.checkFileOwnership("user-2", "file-1");

      expect(result).toBeNull();
    });
  });

  describe("shareFile", () => {
    const mockUser = { id: "user-2", email: "user2@test.com" } as any;

    it("should successfully share file with user", async () => {
      usersService.findUserById.mockResolvedValue(mockUser);
      fileRepository.findOne.mockResolvedValue(mockFile);
      fileShareRepository.findOne.mockResolvedValue(null);
      const mockFileShare = { id: "share-1" } as any;
      fileShareRepository.create.mockReturnValue(mockFileShare);
      fileShareRepository.save.mockResolvedValue(mockFileShare);

      const result = await service.shareFile(
        "user-2",
        "test_value",
        "file-1",
        "user-1",
      );

      expect(usersService.findUserById).toHaveBeenCalledWith("user-2");
      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { id: "file-1" },
      });
      expect(fileShareRepository.findOne).toHaveBeenCalledWith({
        where: { file: { id: "file-1" }, user: { id: "user-2" } },
      });
      expect(fileShareRepository.create).toHaveBeenCalledWith({
        encryptedFileKey: "test_value",
        file: { id: "file-1" },
        user: { id: "user-2" },
        sharedBy: { id: "user-1" },
      });
      expect(fileShareRepository.save).toHaveBeenCalledWith(mockFileShare);
      expect(result).toEqual(mockFileShare);
    });

    it("should throw NotFoundException when user not found", async () => {
      usersService.findUserById.mockResolvedValue(null);

      await expect(
        service.shareFile("user-999", "test_value", "file-1", "user-1"),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.shareFile("user-999", "test_value", "file-1", "user-1"),
      ).rejects.toThrow("User is not found");
    });

    it("should throw NotFoundException when file not found", async () => {
      usersService.findUserById.mockResolvedValue(mockUser);
      fileRepository.findOne.mockResolvedValue(null);

      await expect(
        service.shareFile("user-2", "test_value", "file-999", "user-1"),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.shareFile("user-2", "test_value", "file-999", "user-1"),
      ).rejects.toThrow("File is not found");
    });

    it("should throw BadRequestException when file already shared with user", async () => {
      usersService.findUserById.mockResolvedValue(mockUser);
      fileRepository.findOne.mockResolvedValue(mockFile);
      fileShareRepository.findOne.mockResolvedValue({
        id: "existing-share",
      } as any);

      await expect(
        service.shareFile("user-2", "test_value", "file-1", "user-1"),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.shareFile("user-2", "test_value", "file-1", "user-1"),
      ).rejects.toThrow("File is already shared with this user");
    });

    it("should throw BadRequestException when sharing file with oneself", async () => {
      usersService.findUserById.mockResolvedValue(mockUser);

      await expect(
        service.shareFile("user-1", "test_value", "file-1", "user-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findSharedFiles", () => {
    it("should return shared files for user", async () => {
      const mockSharedFiles = [
        { id: "share-1", file: mockFile, createdAt: new Date() },
      ] as any;
      fileShareRepository.find.mockResolvedValue(mockSharedFiles);

      const result = await service.findSharedFiles("user-1");

      expect(fileShareRepository.find).toHaveBeenCalledWith({
        where: { user: { id: "user-1" } },
        relations: ["file"],
        order: { createdAt: "DESC" },
      });
      expect(result).toEqual([mockFile]);
    });

    it("should return empty array when no shared files", async () => {
      fileShareRepository.find.mockResolvedValue([]);

      const result = await service.findSharedFiles("user-1");

      expect(result).toEqual([]);
    });
  });
});
