import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDefaultForFileShares1776245357512 implements MigrationInterface {
    name = 'RemoveDefaultForFileShares1776245357512'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_shares" ALTER COLUMN "encryptedFileKey" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_shares" ALTER COLUMN "encryptedFileKey" SET DEFAULT 'test_value'`);
    }

}
