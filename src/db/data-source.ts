import "reflect-metadata";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { config as dotenvConfig } from "dotenv";
import path from "path";

dotenvConfig();

const configService = new ConfigService();

export default new DataSource({
  type: "postgres",
  host: configService.getOrThrow<string>("DATABASE_HOST"),
  port: Number(configService.getOrThrow("DATABASE_PORT")),
  username: configService.getOrThrow<string>("DATABASE_USER"),
  password: configService.getOrThrow<string>("DATABASE_PASSWORD"),
  database: configService.getOrThrow<string>("DATABASE_NAME"),
  entities: [path.join(__dirname, "/../**/*.entity{.ts,.js}")],
  migrations: [path.join(__dirname, "/migrations/*{.ts,.js}")],

  synchronize: false,
});
