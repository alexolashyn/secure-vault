import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DbModule } from "./db/db.module";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { BaseFilter } from "./filters/base.filter";
import { FilesModule } from "./files/files.module";
import { MinioModule } from "./minio/minio.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    DbModule,
    FilesModule,
    MinioModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: BaseFilter,
    },
    AppService,
  ],
})
export class AppModule {}
