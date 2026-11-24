# Peta Perlengkapan Jalan v0.3.1

Aplikasi GIS mandiri untuk mengelola dan memublikasikan titik perlengkapan jalan dan fasilitas transportasi. Built with Nuxt, shadcn-style Vue components, Leaflet, PostgreSQL/PostGIS, and Docker.

## Cakupan v0.3.1

- Transit Teal UI refresh based on shadcn UI patterns
- Resilient public Leaflet map lifecycle
- Public/Admin field separation
- Popup peta: foto, kategori, lokasi, kecamatan, koordinat; Tahun Anggaran hanya untuk user login
- Admin-only condition and source metadata
- 44 DKI Jakarta districts as application master data
- Optional location fiscal year (`Tahun Anggaran`)
- Status implementasi internal: `EXISTING` / `PLANNED`, ditampilkan sebagai `Terpasang` / `Direncanakan`
- Single photo per location
- Warna dan ikon marker kategori dapat diedit; pemilihan ikon menggunakan visual icon picker
- Standard Excel template import
- Pratinjau impor dengan status `Valid`, `Peringatan`, dan `Tidak Diimpor` beserta alasan
- Source tracking: Manual or Excel filename + source row + import batch
- Import history and safe rollback
- DB-backed admin session designed to work behind Caddy
- Admin / GIS Manager / GIS Editor roles

## Local development

```bash
cp .env.example .env
```

Generate a session secret:

```bash
openssl rand -hex 32
```

Edit `.env` and set at least:

```env
NUXT_SESSION_SECRET=<generated secret>
NUXT_ADMIN_EMAIL=admin@example.local
NUXT_ADMIN_PASSWORD=<strong password>
```

Then:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Open:

- Public map: http://localhost:3000
- Admin: http://localhost:3000/admin

## Excel import template

Download from the application or directly from:

`/templates/Template_Import_Transportation_GIS_v0.3.xlsx`

The `Template Import` sheet uses one row per GIS point:

| Column | Required | Notes |
| --- | --- | --- |
| No | No | Sequence only |
| Tahun Anggaran | No | Optional. Example: `2027` |
| Kecamatan | Yes | Plain text. Validated against the application's district master |
| Lokasi Kegiatan | Yes | Internal/admin location name |
| Latitude | Yes | Jakarta should be negative, e.g. `-6.1433398` |
| Longitude | Yes | e.g. `106.7850379` |
| Kategori | Yes | e.g. `Speed Bump` |
| Status | No | `Terpasang` atau `Direncanakan`. Kosong dianggap `Terpasang`. Nilai lama `Eksisting` tetap diterima |
| Kondisi | No | Internal only. Unknown/blank values become `Belum Dinilai` with warning |
| Foto | No | One embedded photo per row |

The template intentionally has no dropdowns. District and category values are validated during preview.

## Import preview behavior

Rows are classified before commit:

- **Valid**: ready to import
- **Warning**: imports, but has non-blocking issues such as missing photo or unknown condition
- **Will not import**: blocking issue such as invalid coordinates, unknown category, missing required data, or a duplicate when `Skip duplicates` is enabled
- An unrecognized district is a **Warning**: the original text is imported as internal data, hidden from the public map, and can be corrected from Edit Location using the district dropdown

Potential duplicates are checked using `category + latitude + longitude`.

## Import rollback

Every Excel import creates an import batch. Rollback soft-deletes only records from that batch that have **not** been manually edited after import. Edited records are retained.

## Authentication and Caddy

Sessions are stored in PostgreSQL. The browser receives an opaque HTTP-only cookie.

The cookie `Secure` flag is determined from the actual request protocol or `X-Forwarded-Proto`, so it works behind Caddy without treating plain local HTTP as HTTPS.

A production compose override is included to attach the app to an existing Caddy Docker network:

```bash
# find the network name first
docker network ls

# example when your shared Caddy network is named proxy
PROXY_NETWORK=proxy docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

The production override gives the app container a stable name:

`gis-app`

Caddy example:

```caddyfile
gis.example.com {
    reverse_proxy gis-app:3000
}
```

Caddy and `gis-app` must share the same Docker network.

## Replacing an existing repo

Test this version in a separate folder first. Before overwriting your existing repository:

```bash
git switch -c backup/pre-v0.3
git push -u origin backup/pre-v0.3
git switch main
```

Then copy the new source while preserving `.git` and `.env`, for example:

```bash
rsync -av --delete --exclude='.git' --exclude='.env' /path/to/transportation-gis-v0.3/ /path/to/current-repo/
```

Review:

```bash
git status
git diff --stat
```

Suggested commit:

```text
feat: revise public visibility and Indonesian UI
```

## Database upgrade warning

v0.3 bootstraps its schema automatically using `CREATE TABLE IF NOT EXISTS` and additive setup. However, if your previous prototype used materially different table definitions, back up the database before the first production deployment:

```bash
docker compose exec db pg_dump -U gis gis > gis-backup-before-v0.3.sql
```

For first local testing, a fresh database is recommended:

```bash
docker compose down -v
docker compose up -d --build
```

Do **not** run `down -v` on production unless you intentionally want to delete database volumes.

## Data visibility

Public API intentionally returns only:

- coordinates
- photo
- category
- district
- fiscal year only when the requester has an authenticated session
- implementation status
- location name
- category icon key

It does not send `condition`, source filename, source row, import batch, or other internal metadata.
