/**
 * TypeORM CLI DataSource (migration üretimi/çalıştırma).
 * Uygulama runtime'ı buildTypeOrmConfig'i forRootAsync ile kullanır; CLI bunu kullanır.
 * Kullanım: npm run migration:generate -- src/migrations/Ad   (DB bağlantısı gerekir)
 */
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { buildTypeOrmConfig } from './database.config';

const configService = new ConfigService(process.env);
const {
  autoLoadEntities: _autoLoad,
  synchronize: _sync,
  migrationsRun: _run, // CLI initialize'da migration OTOMATİK çalışmasın
  ...dbOptions
} = buildTypeOrmConfig(configService);

export default new DataSource({
  ...(dbOptions as DataSourceOptions),
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/../migrations/*{.ts,.js}`],
  synchronize: false,
});
