import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors();

  const port = configService.getOrThrow<number>("PORT", 3000);
  const host = configService.getOrThrow<string>("HOST", "localhost");

  await app.listen(port);
  Logger.log(`Server is running on http://${host}:${port}`, "Bootstrap");
}

bootstrap();
