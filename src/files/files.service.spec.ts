import { Test, TestingModule } from "@nestjs/testing";
import { FilesService } from "./files.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { FileEntity } from "./file.entity";
import { MinioService } from "../minio/minio.service";
import { UploadRequestDto } from "../dtos/file/upload-request.dto";

describe("FilesService", () => {
  let service: FilesService;
  let fileRepository: jest.Mocked<Repository<FileEntity>>;
  let minioService: jest.Mocked<MinioService>;

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

  const mockMinioService = {
    getPresignedUrlForUpload: jest.fn(),
    getPresignedUrlForDownload: jest.fn(),
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
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    fileRepository = module.get(getRepositoryToken(FileEntity));
    minioService = module.get(MinioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return files for a specific user", async () => {
      const mockFiles = [mockFile];
      fileRepository.find.mockResolvedValue(mockFiles);

      const result = await service.findAll("user-1");

      expect(fileRepository.find).toHaveBeenCalledWith({
        where: { owner: { id: "user-1" } },
        order: { createdAt: "DESC" },
      });
      expect(result).toEqual(mockFiles);
    });

    it("should return empty array when no files exist", async () => {
      fileRepository.find.mockResolvedValue([]);

      const result = await service.findAll("user-1");

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
        where: { id: "file-1", owner: { id: "user-1" } },
      });
      expect(minioService.getPresignedUrlForDownload).toHaveBeenCalledWith(
        "uuid-path",
        "test.txt",
      );
      expect(result).toEqual({
        downloadUrl: "download_url",
        file: mockFile,
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
  });
});
