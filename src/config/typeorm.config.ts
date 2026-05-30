import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { buildTypeOrmConfig } from './database.config';

const configService = new ConfigService(process.env);
const { autoLoadEntities: _autoLoad, synchronize: _sync, ...dbOptions } =
  buildTypeOrmConfig(configService);

export default new DataSource({
  ...(dbOptions as DataSourceOptions),
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/../migrations/*{.ts,.js}`],
  synchronize: false,
});
