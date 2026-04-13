import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { BaseResponseDto } from "../dtos/response/base-response.dto";

@Catch()
export class BaseFilter implements ExceptionFilter {
  private readonly logger = new Logger(BaseFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let details: string | object = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      details =
        typeof exceptionResponse === "object"
          ? (exceptionResponse as any).message || exceptionResponse
          : exceptionResponse;
    } else {
      this.logger.error(
        `Unhandled error: ${exception}`,
        (exception as any).stack,
      );
    }

    const errorResponse = new BaseResponseDto(status, details, "error");

    response.status(status).json(errorResponse);
  }
}
