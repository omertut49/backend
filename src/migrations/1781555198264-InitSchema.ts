import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1781555198264 implements MigrationInterface {
    name = 'InitSchema1781555198264'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_resolvedById"`);
        await queryRunner.query(`ALTER TABLE "idea_sessions" DROP CONSTRAINT "fk_idea_sessions_player"`);
        await queryRunner.query(`ALTER TABLE "players" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_96c48f2061ac14169c54a3f2d0e" FOREIGN KEY ("resolvedById") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "idea_sessions" ADD CONSTRAINT "FK_daaf6c51ee2ee84ad75875580c3" FOREIGN KEY ("createdById") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "idea_sessions" DROP CONSTRAINT "FK_daaf6c51ee2ee84ad75875580c3"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_96c48f2061ac14169c54a3f2d0e"`);
        await queryRunner.query(`ALTER TABLE "players" ADD "role" character varying NOT NULL DEFAULT 'developer'`);
        await queryRunner.query(`ALTER TABLE "idea_sessions" ADD CONSTRAINT "fk_idea_sessions_player" FOREIGN KEY ("createdById") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_reports_resolvedById" FOREIGN KEY ("resolvedById") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
