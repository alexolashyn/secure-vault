import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFileEntity1776344900905 implements MigrationInterface {
    name = 'UpdateFileEntity1776344900905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."files_status_enum" AS ENUM('pending', 'success', 'failed')`);
        await queryRunner.query(`ALTER TABLE "files" ADD "status" "public"."files_status_enum" NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."files_status_enum"`);
    }

}
