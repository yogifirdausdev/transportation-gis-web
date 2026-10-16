import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg
let pool: pg.Pool | null = null
let initialized = false
let initPromise: Promise<void> | null = null

export function db() {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = new Pool({ connectionString: config.databaseUrl, max: 12, idleTimeoutMillis: 30_000 })
    pool.on('error', (error) => console.error('Postgres pool error', error))
  }
  return pool
}

export async function ensureSchema() {
  if (initialized) return
  if (initPromise) return initPromise
  initPromise = (async () => {
    const client = await db().connect()
    try {
      await client.query('BEGIN')
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis')
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'gis_editor' CHECK (role IN ('admin','gis_manager','gis_editor')),
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          color TEXT NOT NULL DEFAULT '#1d4ed8',
          icon TEXT NOT NULL DEFAULT 'map-pin',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      await client.query(`
        CREATE TABLE IF NOT EXISTS locations (
          id BIGSERIAL PRIMARY KEY,
          category_id INTEGER NOT NULL REFERENCES categories(id),
          name TEXT NOT NULL,
          district TEXT,
          address TEXT,
          condition TEXT NOT NULL DEFAULT 'unassessed' CHECK (condition IN ('good','bad','unassessed')),
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          road_width DOUBLE PRECISION,
          speed_bump_units DOUBLE PRECISION,
          speed_bump_m DOUBLE PRECISION,
          endcap_units DOUBLE PRECISION,
          before_photo_url TEXT,
          after_photo_url TEXT,
          notes TEXT,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          geom geometry(Point, 4326) NOT NULL,
          created_by BIGINT REFERENCES users(id),
          updated_by BIGINT REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      await client.query('CREATE INDEX IF NOT EXISTS locations_geom_gix ON locations USING GIST (geom)')
      await client.query('CREATE INDEX IF NOT EXISTS locations_district_idx ON locations (district)')
      await client.query('CREATE INDEX IF NOT EXISTS locations_category_idx ON locations (category_id)')
      await client.query('CREATE INDEX IF NOT EXISTS locations_condition_idx ON locations (condition)')
      await client.query(`INSERT INTO categories (slug,name,color,icon) VALUES ('speed-bump','Speed Bump','#d97706','construction') ON CONFLICT (slug) DO NOTHING`)
      const config = useRuntimeConfig()
      const email = String(config.adminEmail).trim().toLowerCase()
      const existing = await client.query('SELECT id FROM users WHERE email=$1', [email])
      if (!existing.rowCount) {
        const hash = await bcrypt.hash(String(config.adminPassword), 12)
        await client.query('INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4)', ['GIS Administrator', email, hash, 'admin'])
        console.log(`Created initial GIS admin: ${email}`)
      }
      await client.query('COMMIT')
      initialized = true
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
      initPromise = null
    }
  })()
  return initPromise
}

export function slugify(input: string) {
  return input.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || `category-${Date.now()}`
}
