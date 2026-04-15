import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFileShares1776242277955 implements MigrationInterface {
  name = "UpdateFileShares1776242277955";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file_shares" ADD "encryptedFileKey" character varying NOT NULL DEFAULT 'test_value'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file_shares" DROP COLUMN "encryptedFileKey"`,
    );
  }
}
