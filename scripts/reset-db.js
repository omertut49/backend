/**
 * Geliştirme veritabanını sıfırlar: public şemasını komple düşürüp yeniden oluşturur.
 * Tüm tablolar, enum tipleri ve veriler silinir. Supabase için standart reset desenidir.
 *
 * Çalıştırma:  node scripts/reset-db.js
 *
 * Şema boşaltıldıktan sonra `npm run start:dev` ile uygulamayı başlatın;
 * DB_SYNC=true olduğu için TypeORM tüm tabloları entity'lerden yeniden kurar.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// .env'i basitçe oku (dotenv'e bağımlı olmadan)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

async function main() {
  loadEnv();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('HATA: DATABASE_URL bulunamadı (.env kontrol edin).');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Bağlandı. public şeması sıfırlanıyor...');

  // Tek tek (pgbouncer transaction-mode pooler ile uyumlu olması için)
  await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
  await client.query('CREATE SCHEMA public;');
  // Supabase standart yetkileri geri yükle
  await client.query('GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;');
  await client.query('GRANT ALL ON SCHEMA public TO postgres, service_role;');

  console.log('✓ Veritabanı sıfırlandı. Şimdi: npm run start:dev');
  await client.end();
}

main().catch((err) => {
  console.error('Sıfırlama başarısız:', err.message);
  process.exit(1);
});
