import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.getOrThrow<string>("DATABASE_HOST"),
        port: config.getOrThrow<number>("DATABASE_PORT"),
        username: config.getOrThrow<string>("DATABASE_USER"),
        password: config.getOrThrow<string>("DATABASE_PASSWORD"),
        database: config.getOrThrow<string>("DATABASE_NAME"),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
})
export class DbModule {}
