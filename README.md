# Transportation GIS — Shadcn rebuild

Standalone GIS MVP untuk data fasilitas transportasi. Rebuild ini memakai **Nuxt 4 + shadcn/vue-style components + Leaflet + PostgreSQL/PostGIS**.

## Fitur

- Public full-screen GIS map
- Search/filter kategori, kondisi, dan kecamatan
- Map fetch berbasis viewport / bounding box
- Leaflet lifecycle hardening: client-only init, ResizeObserver, `invalidateSize()`, visibility/focus recovery, request cancellation, loading/error/tile states
- Admin login terpisah dari WordPress
- Role `admin`, `gis_manager`, dan `gis_editor`
- CRUD lokasi + click-on-map coordinate picker
- Upload foto Sebelum/Sesudah
- Multi-category GIS
- Direct import Excel laporan Dishub `.xlsx`
- Embedded Excel photos extraction
- Jakarta positive-latitude correction
- Duplicate-coordinate protection
- Docker Compose
- Custom PostGIS image yang dapat dibangun native pada ARM64 dan AMD64

## 1. Menjalankan di Mac / development

```bash
cp .env.example .env
```

Edit `.env`, minimal ganti:

```env
POSTGRES_PASSWORD=your-db-password
DATABASE_URL=postgres://gis:your-db-password@db:5432/gis
NUXT_SESSION_SECRET=use-a-long-random-secret-at-least-32-characters
NUXT_ADMIN_EMAIL=admin@example.local
NUXT_ADMIN_PASSWORD=use-a-strong-password
```

Kemudian:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Buka:

- Public map: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`

> Initial admin hanya dibuat ketika email tersebut belum ada di database. Mengganti password di `.env` setelah akun sudah dibuat tidak otomatis mengganti password database.

## 2. Deploy ke VPS + Caddy

Clone repo, buat `.env`, lalu:

```bash
docker compose up -d --build
```

Caddy paling sederhana menggunakan subdomain:

```caddy
 gis.example.go.id {
     encode zstd gzip
     reverse_proxy 127.0.0.1:3000
 }
```

Kemudian reload Caddy sesuai setup server kamu.

## 3. Import Excel Dishub

Admin → **Bulk Import** → upload `.xlsx` → Preview → Import.

Importer mencari worksheet yang memiliki kombinasi header seperti:

- `Lokasi Kegiatan`
- `Latitude`
- `Longitude` / `Longtitude`
- `Sebelum`
- `Sesudah`
- `Baik / Sesuai`
- `Tidak Baik / Tidak Sesuai`

Section seperti `Kecamatan Koja` otomatis diterapkan ke record setelahnya. Foto embedded yang ter-anchor ke kolom Sebelum/Sesudah ikut diekstrak.

Latitude Jakarta yang tersimpan sebagai `6.x` dapat dikoreksi menjadi `-6.x` saat commit import.

## 4. Role

- **Administrator**: seluruh fitur GIS.
- **GIS Manager**: locations, import, categories, users. Tidak memiliki akses WordPress karena aplikasi ini sepenuhnya terpisah.
- **GIS Editor**: dashboard, locations, manual CRUD, upload, dan bulk import. Menu categories/users disembunyikan dan API-nya juga membatasi role.

## 5. Kenapa map rebuild ini lebih stabil

Map berada di `GisMap.client.vue`, sehingga tidak dibuat pada SSR. Sebelum `L.map()` dijalankan, komponen menunggu container punya width/height nyata. Setelah init, map di-refresh melalui `ResizeObserver`, browser `focus`, `pageshow`, dan `visibilitychange`. API marker juga dibatalkan ketika request lama masih berjalan dan viewport/filter berubah.

Jika basemap gagal memuat tile, UI menampilkan warning. Jika API marker gagal, basemap tetap hidup dan user mendapat tombol retry. Ini menghindari kasus halaman sekadar kosong tanpa feedback.

## 6. Backup

Data utama berada pada named volumes `pgdata` dan `appdata`. Jangan menjalankan:

```bash
docker compose down -v
```

kecuali memang ingin menghapus database dan file upload.

Untuk backup production, setidaknya lakukan `pg_dump` berkala dan backup volume/file `/data`.

## 7. Development tanpa Docker untuk app

Database tetap bisa dijalankan dengan Docker:

```bash
docker compose up -d db
```

Lalu gunakan Node lokal dengan `DATABASE_URL` yang mengarah ke Postgres yang dapat diakses host. Default Compose tidak mem-publish port database, jadi tambahkan port sementara bila memang diperlukan untuk workflow ini.
