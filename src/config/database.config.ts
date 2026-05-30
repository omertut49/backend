import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildTypeOrmConfig(config: ConfigService): TypeOrmModuleOptions {
  const databaseUrl = config.get<string>('DATABASE_URL');
  const useSsl = config.get<string>('DB_SSL', 'false') === 'true';

  const synchronize =
    config.get('NODE_ENV') !== 'production' && config.get('DB_SYNC') === 'true';

  const ssl = useSsl
    ? {
        rejectUnauthorized: config.get<string>('DB_SSL_REJECT_UNAUTHORIZED', 'false') === 'true',
      }
    : false;

  const shared = {
    type: 'postgres' as const,
    autoLoadEntities: true,
    synchronize,
    ssl,
  };

  if (databaseUrl) {
    return { ...shared, url: databaseUrl };
  }

  return {
    ...shared,
    host: config.get<string>('DB_HOST', 'localhost'),
    port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_NAME', 'gamepm_db'),
  };
}
