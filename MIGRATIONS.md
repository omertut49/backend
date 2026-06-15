# Veritabanı Migration Rehberi

Prod'da `synchronize` **kapalı** (şema otomatik güncellenmez). Şema değişiklikleri
artık **migration** ile yönetilir; elle `ALTER TABLE` çalıştırmaya gerek yok.

## Nasıl çalışır

- **Prod (Render):** Uygulama boot ederken bekleyen migration'lar **otomatik** çalışır
  (`migrationsRun: true`, `src/config/database.config.ts`). Deploy = migration uygulanır.
- **Dev:** `DB_SYNC=true` ise `synchronize` şemayı entity'lerden kurar (migration gerekmez).
  Migration akışını dev'de denemek istersen `DB_SYNC=false` yapıp `migration:run` kullan.
- Migration dosyaları: `src/migrations/*.ts` → build ile `dist/migrations/*.js`.
- CLI DataSource'u: `src/config/typeorm.config.ts` (DB bağlantısı için `.env` okur).

## Komutlar

```bash
# Entity ile DB arasındaki farktan otomatik migration üret (DB bağlantısı GEREKİR)
npm run migration:generate -- src/migrations/AciklayiciAd

# Boş migration iskeleti oluştur (DB gerekmez; SQL'i elle yazarsın)
npm run migration:create src/migrations/AciklayiciAd

# Bekleyen migration'ları uygula (dev'de elle; prod'da otomatik)
npm run migration:run

# Son migration'ı geri al
npm run migration:revert

# Migration durumunu göster
npm run migration:show
```

## İlk kurulum (baseline) — Supabase ayağa kalkınca BİR KEZ

Prod DB'de tablolar zaten mevcut. Baseline'ı **canlı DB'ye karşı** üret ki migration
sadece gerçek farkı (eksik kolon vb.) içersin, var olan tabloları yeniden CREATE etmeye
çalışmasın:

```bash
# .env içindeki DATABASE_URL canlı Supabase'e bakıyor olmalı
npm run migration:generate -- src/migrations/InitSchema
```

- "No changes in database schema were found" derse: şema entity'lerle uyumlu →
  takip tablosunu başlatmak için boş bir migration `migration:create` ile ekleyip commit et.
- Fark çıkarsa: üretilen dosyayı **gözden geçir**, commit et, push et → Render deploy'da
  `migrationsRun` otomatik uygular.

> ⚠️ Baseline'ı boş bir DB'ye karşı üretME — aksi halde tüm tabloları CREATE eden bir
> migration çıkar ve mevcut prod DB'de "relation already exists" ile boot'u çökertir.

## Bundan sonra her şema değişikliğinde

1. Entity'yi düzenle.
2. `npm run migration:generate -- src/migrations/Aciklama`
3. Üretilen migration'ı gözden geçir.
4. Commit + push → prod deploy'da otomatik uygulanır.
