import { SetMetadata } from "@nestjs/common";

export const TRANSFORM_RESPONSE_KEY = "transform_response_key";
export const TransformResponse = (dto: any) =>
  SetMetadata(TRANSFORM_RESPONSE_KEY, dto);
