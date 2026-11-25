import bcrypt from 'bcryptjs'
import { q } from '../utils/db'
import { ensureStorage, cleanupTempImports } from '../utils/files'

const districts = [
  'Cakung','Cempaka Putih','Cengkareng','Cilandak','Cilincing','Cipayung','Ciracas','Duren Sawit','Gambir','Grogol Petamburan',
  'Jagakarsa','Jatinegara','Johar Baru','Kalideres','Kebayoran Baru','Kebayoran Lama','Kebon Jeruk','Kelapa Gading','Kemayoran','Kembangan',
  'Kepulauan Seribu Selatan','Kepulauan Seribu Utara','Koja','Kramat Jati','Makasar','Mampang Prapatan','Matraman','Menteng','Pademangan','Palmerah',
  'Pancoran','Pasar Minggu','Pasar Rebo','Penjaringan','Pesanggrahan','Pulo Gadung','Sawah Besar','Senen','Setiabudi','Taman Sari','Tambora',
  'Tanah Abang','Tanjung Priok','Tebet'
]

export default defineNitroPlugin(async () => {
  await ensureStorage()
  await cleanupTempImports()
  await q('CREATE EXTENSION IF NOT EXISTS postgis')
  await q('CREATE EXTENSION IF NOT EXISTS pgcrypto')

  await q(`CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text NOT NULL DEFAULT 'Administrator',
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','manager','editor')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`)

  await q(`CREATE TABLE IF NOT EXISTS sessions (
    token_hash text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`)
  await q('CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at)')

  await q(`CREATE TABLE IF NOT EXISTS districts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL
  )`)

  await q(`CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    color text NOT NULL DEFAULT '#0F766E',
    icon_key text NOT NULL DEFAULT 'map-pin',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`)

  await q(`CREATE TABLE IF NOT EXISTS import_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name text NOT NULL,
    imported_by uuid REFERENCES users(id),
    total_rows integer NOT NULL DEFAULT 0,
    imported_rows integer NOT NULL DEFAULT 0,
    skipped_rows integer NOT NULL DEFAULT 0,
    warning_rows integer NOT NULL DEFAULT 0,
    rolled_back_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`)

  await q(`CREATE TABLE IF NOT EXISTS locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_name text NOT NULL,
    category_id uuid NOT NULL REFERENCES categories(id),
    district_id uuid REFERENCES districts(id),
    district_raw text,
    fiscal_year integer,
    implementation_status text NOT NULL DEFAULT 'EXISTING' CHECK (implementation_status IN ('EXISTING','PLANNED')),
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    geom geometry(Point,4326),
    condition text NOT NULL DEFAULT 'Belum Dinilai',
    photo_path text,
    source_type text NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual','excel')),
    source_file_name text,
    source_row integer,
    import_batch_id uuid REFERENCES import_batches(id),
    created_by uuid REFERENCES users(id),
    modified_after_import boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
  )`)
  // Additive compatibility for earlier prototype schemas.
  await q("ALTER TABLE categories ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#0F766E'")
  await q("ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_key text NOT NULL DEFAULT 'map-pin'")
  await q("ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()")
  await q("ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()")
  await q("UPDATE categories SET color='#0F766E' WHERE color IS NULL OR color=''")

  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS location_name text')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id)')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES districts(id)')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS district_raw text')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS fiscal_year integer')
  await q("ALTER TABLE locations ADD COLUMN IF NOT EXISTS implementation_status text NOT NULL DEFAULT 'EXISTING'")
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS latitude double precision')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS longitude double precision')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS geom geometry(Point,4326)')
  await q("ALTER TABLE locations ADD COLUMN IF NOT EXISTS condition text NOT NULL DEFAULT 'Belum Dinilai'")
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS photo_path text')
  await q("ALTER TABLE locations ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual'")
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS source_file_name text')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS source_row integer')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES import_batches(id)')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id)')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS modified_after_import boolean NOT NULL DEFAULT false')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()')
  await q('ALTER TABLE locations ADD COLUMN IF NOT EXISTS deleted_at timestamptz')
  await q('ALTER TABLE locations ALTER COLUMN district_id DROP NOT NULL')
  await q('ALTER TABLE locations ALTER COLUMN fiscal_year DROP NOT NULL')
  await q("UPDATE locations SET implementation_status='EXISTING' WHERE implementation_status IS NULL OR implementation_status NOT IN ('EXISTING','PLANNED')")
  await q(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='locations_implementation_status_check') THEN
      ALTER TABLE locations ADD CONSTRAINT locations_implementation_status_check CHECK (implementation_status IN ('EXISTING','PLANNED'));
    END IF;
  END $$`)

  // Best-effort migration from common v0.1 prototype column names.
  await q(`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='name') THEN
      EXECUTE 'UPDATE locations SET location_name=name WHERE location_name IS NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='district') THEN
      EXECUTE 'UPDATE locations SET district_raw=district WHERE district_id IS NULL AND district_raw IS NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='photo_after') THEN
      EXECUTE 'UPDATE locations SET photo_path=photo_after WHERE photo_path IS NULL AND photo_after IS NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='photo_before') THEN
      EXECUTE 'UPDATE locations SET photo_path=photo_before WHERE photo_path IS NULL AND photo_before IS NOT NULL';
    END IF;
  END $$`)
  await q(`UPDATE locations l SET district_id=d.id, district_raw=NULL FROM districts d WHERE l.district_id IS NULL AND l.district_raw IS NOT NULL AND lower(trim(l.district_raw))=lower(d.name)`)
  await q('CREATE INDEX IF NOT EXISTS locations_geom_idx ON locations USING gist(geom)')
  await q('CREATE INDEX IF NOT EXISTS locations_active_idx ON locations(deleted_at, category_id, district_id, fiscal_year)')
  await q('CREATE INDEX IF NOT EXISTS locations_status_idx ON locations(deleted_at, implementation_status)')

  await q(`CREATE OR REPLACE FUNCTION locations_set_geom() RETURNS trigger AS $$
    BEGIN
      NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude),4326);
      NEW.updated_at = now();
      RETURN NEW;
    END; $$ LANGUAGE plpgsql`)
  await q('DROP TRIGGER IF EXISTS locations_geom_trigger ON locations')
  await q(`CREATE TRIGGER locations_geom_trigger BEFORE INSERT OR UPDATE OF latitude,longitude ON locations FOR EACH ROW EXECUTE FUNCTION locations_set_geom()`)
  await q(`UPDATE locations SET geom=ST_SetSRID(ST_MakePoint(longitude,latitude),4326) WHERE geom IS NULL`)

  for (const name of districts) await q('INSERT INTO districts(name) VALUES($1) ON CONFLICT(name) DO NOTHING', [name])
  await q(`UPDATE locations l SET district_id=d.id, district_raw=NULL FROM districts d WHERE l.district_id IS NULL AND l.district_raw IS NOT NULL AND lower(trim(l.district_raw))=lower(d.name)`)
  await q(`INSERT INTO categories(name,color,icon_key) VALUES('Speed Bump','#F59E0B','speed-bump') ON CONFLICT(name) DO NOTHING`)
  await q("UPDATE categories SET icon_key='speed-bump',updated_at=now() WHERE lower(trim(name)) IN ('speed bump','speedbump') AND icon_key IN ('map-pin','traffic-cone')")

  const config = useRuntimeConfig()
  if (config.adminEmail && config.adminPassword) {
    const existing = await q('SELECT id FROM users WHERE lower(email)=lower($1)', [String(config.adminEmail)])
    if (!existing.rows[0]) {
      const hash = await bcrypt.hash(String(config.adminPassword), 12)
      await q('INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,$4)', [String(config.adminEmail).toLowerCase(), 'Administrator', hash, 'admin'])
    }
  }

  await q('DELETE FROM sessions WHERE expires_at < now()')
})
