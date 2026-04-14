import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFileShares1776155671910 implements MigrationInterface {
    name = 'CreateFileShares1776155671910'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "file_shares" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP, "fileId" uuid, "userId" uuid, "sharedById" uuid, CONSTRAINT "PK_2f3e107e30c8ad1012907a4346b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "file_shares" ADD CONSTRAINT "FK_3be82d02cab91b354b8aa25f172" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_shares" ADD CONSTRAINT "FK_663ee96edb87078ffb7a8ec8513" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_shares" ADD CONSTRAINT "FK_a939bda77f09a8be83ff685a75d" FOREIGN KEY ("sharedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_shares" DROP CONSTRAINT "FK_a939bda77f09a8be83ff685a75d"`);
        await queryRunner.query(`ALTER TABLE "file_shares" DROP CONSTRAINT "FK_663ee96edb87078ffb7a8ec8513"`);
        await queryRunner.query(`ALTER TABLE "file_shares" DROP CONSTRAINT "FK_3be82d02cab91b354b8aa25f172"`);
        await queryRunner.query(`DROP TABLE "file_shares"`);
    }

}
