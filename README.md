# Transportation GIS Web

Standalone GIS web app for transportation assets. The first supported dataset is **Speed Bump**, but the data model is multi-category so CCTV, APILL, bus stops, signs, parking, and other point assets can be added later without changing the core schema.

## Stack

- Nuxt 4 + Nitro full-stack server
- Leaflet + OpenStreetMap
- PostgreSQL 17 + PostGIS 3.6
- Cookie/JWT authentication
- Role-based access: `admin`, `gis_manager`, `gis_editor`
- ExcelJS + direct XLSX drawing extraction for Dishub Excel imports
- Docker Compose deployment

## Implemented MVP features

- Public full-screen interactive map
- Bounding-box API: only points in the visible map area are requested
- Search and filters by category, condition, and district
- Multi-category marker colors
- Admin dashboard
- Location CRUD
- Category management
- GIS user management
- GIS Editor / GIS Manager access separation
- Direct `.xlsx` bulk import for the Dishub speed-bump report format
- Extracts embedded Before/After photos from XLSX drawing anchors
- Corrects positive Jakarta latitude values such as `6.1178` to `-6.1178`
- Handles decimal comma coordinates
- Import preview, status validation, and duplicate-coordinate protection
- PostGIS geometry column + spatial index
- Can run on `/` or under a subpath such as `/gis/`

## 1. Quick start with Docker

Copy the environment file:

```bash
cp .env.example .env
```

Change at least these values:

```env
NUXT_SESSION_SECRET=put-a-long-random-secret-here
NUXT_ADMIN_EMAIL=your-admin@email.local
NUXT_ADMIN_PASSWORD=use-a-strong-password
```

Start the stack:

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:3000
```

Admin:

```text
http://localhost:3000/admin
```

The first startup automatically creates the database tables, enables PostGIS, creates the `Speed Bump` category, and creates the bootstrap admin if the user table is empty.

## 2. Import the existing Dishub Excel report

Go to:

```text
Admin GIS → Bulk Import
```

Upload a file such as:

```text
6. Bobot Pemasangan Speedbump Termin II (Koja).xlsx
```

The importer detects the worksheet with these logical fields:

- Lokasi Kegiatan
- Lebar Jalan
- SPEED BUMP (unit)
- SPEED BUMP (m)
- ENDCAP (pasang)
- Latitude
- Longitude / Longtitude
- Foto Sebelum
- Foto Sesudah
- Baik / Sesuai
- Tidak Baik / Tidak Sesuai
- Kecamatan section rows

The provided Koja workbook is expected to yield 31 location rows and 62 anchored photos.

## 3. Roles

### GIS Editor

Can:
- view admin GIS data
- create/edit locations
- bulk import Excel

Cannot:
- delete locations
- manage categories
- manage users

### GIS Manager

Can everything GIS Editor can, plus:
- delete locations
- manage categories

### Admin

Can additionally manage GIS users.

These are app-level roles and do not grant any WordPress access because this application is fully separate from WordPress.

## 4. Deploy on the same domain as WordPress

The recommended long-term setup is reverse proxying the app under `/gis/` while WordPress remains at `/`.

Set:

```env
NUXT_APP_BASE_URL=/gis/
```

Example Nginx block, assuming the GIS app listens on `127.0.0.1:3000`:

```nginx
location /gis/ {
    client_max_body_size 60M;
    proxy_read_timeout 120s;
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Important: there is **no trailing slash** after `3000` in `proxy_pass`, so Nginx preserves the `/gis/` prefix. Nuxt's `NUXT_APP_BASE_URL` then handles application routes, assets, API routes, and uploaded photos under the same prefix.

The result can be:

```text
https://dishub.example.go.id/       → WordPress
https://dishub.example.go.id/gis/   → Transportation GIS
```

A subdomain such as `gis.dishub.example.go.id` is also fine and is slightly simpler operationally.

## 5. Development without Docker

You still need PostgreSQL + PostGIS available locally.

```bash
npm install
cp .env.example .env
npm run dev
```

For local development with a database running on localhost, set:

```env
DATABASE_URL=postgresql://gis:gis@localhost:5432/gis
NUXT_APP_BASE_URL=/
```

## 6. Data model

Core location records use a general model rather than a `speed_bump`-specific table:

```text
locations
├── category_id
├── name
├── district
├── address
├── condition
├── latitude
├── longitude
├── geom (PostGIS Point, EPSG:4326)
├── details (JSONB)
├── before_photo_url
├── after_photo_url
├── source_file
├── created_by
└── updated_by
```

Speed-bump-specific fields such as road width, unit count, meter length, and endcap count are stored inside `details` JSONB. This keeps the core table usable for future categories.

## 7. Production notes

- Change the default PostgreSQL password in a real deployment. The Compose credentials are intentionally simple for initial setup.
- Keep `NUXT_SESSION_SECRET` private and long/random.
- Back up both the PostgreSQL volume and the application data volume containing uploaded photos.
- The public map currently uses the standard OpenStreetMap tile endpoint. That is suitable for development/light use. For significant public traffic, use an appropriate tile provider or host tiles according to OpenStreetMap's tile usage policy.
- For tens of thousands of points, the existing bounding-box query already prevents loading the entire database. Marker clustering/vector tiles can be added when real data volume requires it.
- Manual location CRUD currently preserves imported photos but manual photo upload is intentionally left for the next iteration.

## Health check

```text
GET /api/health
```

Or with a subpath deployment:

```text
GET /gis/api/health
```
