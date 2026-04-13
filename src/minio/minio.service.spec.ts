import { Test, TestingModule } from "@nestjs/testing";
import { MinioService } from "./minio.service";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";
import * as Minio from "minio";

describe("MinioService", () => {
  let service: MinioService;
  let configService: jest.Mocked<ConfigService>;
  let mockMinioClient: any;

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    mockMinioClient = {
      presignedPutObject: jest.fn(),
      presignedGetObject: jest.fn(),
    };

    jest.spyOn(Minio, "Client").mockImplementation(() => mockMinioClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinioService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MinioService>(MinioService);
    configService = module.get(ConfigService);

    configService.getOrThrow.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        MINIO_ENDPOINT: "localhost",
        MINIO_PORT: "9000",
        MINIO_ACCESS_KEY: "access_key",
        MINIO_SECRET_KEY: "secret_key",
        MINIO_BUCKET_NAME: "secure-vault",
      };
      return config[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should initialize MinioClient with correct config", () => {
    expect(configService.getOrThrow).toHaveBeenCalledWith("MINIO_ENDPOINT");
    expect(configService.getOrThrow).toHaveBeenCalledWith("MINIO_PORT");
    expect(configService.getOrThrow).toHaveBeenCalledWith("MINIO_ACCESS_KEY");
    expect(configService.getOrThrow).toHaveBeenCalledWith("MINIO_SECRET_KEY");
    expect(configService.getOrThrow).toHaveBeenCalledWith("MINIO_BUCKET_NAME");
    expect(Minio.Client).toHaveBeenCalledWith({
      endPoint: "localhost",
      port: 9000,
      useSSL: false,
      accessKey: "access_key",
      secretKey: "secret_key",
    });
  });

  describe("getPresignedUrlForUpload", () => {
    it("should return presigned upload URL", async () => {
      const mockUrl = "http://localhost:9000/bucket/path?X-Amz-Signature=xxx";
      mockMinioClient.presignedPutObject.mockResolvedValue(mockUrl);

      const result = await service.getPresignedUrlForUpload("test-path");

      expect(mockMinioClient.presignedPutObject).toHaveBeenCalledWith(
        "secure-vault",
        "test-path",
        3600,
      );
      expect(result).toBe(mockUrl);
    });

    it("should throw InternalServerErrorException on error", async () => {
      mockMinioClient.presignedPutObject.mockRejectedValue(
        new Error("Minio error"),
      );

      await expect(
        service.getPresignedUrlForUpload("test-path"),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getPresignedUrlForDownload", () => {
    it("should return presigned download URL with correct headers", async () => {
      const mockUrl = "http://localhost:9000/bucket/path?X-Amz-Signature=xxx";
      mockMinioClient.presignedGetObject.mockResolvedValue(mockUrl);

      const result = await service.getPresignedUrlForDownload(
        "test-path",
        "filename.txt",
      );

      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        "secure-vault",
        "test-path",
        3600,
        {
          "response-content-disposition": 'attachment; filename="filename.txt"',
        },
      );
      expect(result).toBe(mockUrl);
    });

    it("should throw InternalServerErrorException on error", async () => {
      mockMinioClient.presignedGetObject.mockRejectedValue(
        new Error("Minio error"),
      );

      await expect(
        service.getPresignedUrlForDownload("test-path", "filename.txt"),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
