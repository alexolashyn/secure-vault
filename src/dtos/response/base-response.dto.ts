import { HttpStatus } from "@nestjs/common";

export class BaseResponseDto<T> {
  statusCode: HttpStatus;

  details: T;

  result: string;

  constructor(statusCode: HttpStatus, data: T, result: string = "working") {
    this.statusCode = statusCode;
    this.details = data;
    this.result = result;
  }
}
