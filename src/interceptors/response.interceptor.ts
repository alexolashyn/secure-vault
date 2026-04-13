import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { plainToInstance } from "class-transformer";
import { BaseResponseDto } from "../dtos/response/base-response.dto";
import { TRANSFORM_RESPONSE_KEY } from "../decorators/transform-response.decorator";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    const targetDto = this.reflector.getAllAndOverride(TRANSFORM_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      map((payload) => {
        if (!targetDto || !payload) {
          return new BaseResponseDto(response.statusCode, payload);
        }

        const transformedData = plainToInstance(targetDto, payload, {
          excludeExtraneousValues: true,
        });

        return new BaseResponseDto(response.statusCode, transformedData);
      }),
    );
  }
}
