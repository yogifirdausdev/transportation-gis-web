import bcrypt from 'bcryptjs'
import { db } from './db'

export async function ensureSchema() {
  await db.query(`CREATE EXTENSION IF NOT EXISTS postgis`)
  await db.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`)

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role text NOT NULL CHECK (role IN ('admin','gis_manager','gis_editor')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      marker_color text NOT NULL DEFAULT '#1d4ed8',
      icon text NOT NULL DEFAULT 'pin',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS locations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      name text NOT NULL,
      district text,
      address text,
      condition text NOT NULL DEFAULT 'unassessed' CHECK (condition IN ('good','bad','unassessed')),
      latitude double precision NOT NULL,
      longitude double precision NOT NULL,
      geom geometry(Point, 4326) NOT NULL,
      details jsonb NOT NULL DEFAULT '{}'::jsonb,
      before_photo_url text,
      after_photo_url text,
      source_file text,
      created_by uuid REFERENCES users(id) ON DELETE SET NULL,
      updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  await db.query(`CREATE INDEX IF NOT EXISTS locations_geom_gix ON locations USING GIST (geom)`)
  await db.query(`CREATE INDEX IF NOT EXISTS locations_category_idx ON locations(category_id)`)
  await db.query(`CREATE INDEX IF NOT EXISTS locations_district_idx ON locations(district)`)
  await db.query(`CREATE INDEX IF NOT EXISTS locations_condition_idx ON locations(condition)`)
  await db.query(`CREATE INDEX IF NOT EXISTS locations_created_at_idx ON locations(created_at DESC)`)

  await db.query(`
    INSERT INTO categories (name, slug, marker_color, icon)
    VALUES ('Speed Bump', 'speed-bump', '#eab308', 'speed-bump')
    ON CONFLICT (slug) DO NOTHING
  `)

  const adminEmail = process.env.NUXT_ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.NUXT_ADMIN_PASSWORD || 'ChangeMe123!'
  const existing = await db.query('SELECT id FROM users LIMIT 1')
  if (existing.rowCount === 0) {
    const hash = await bcrypt.hash(adminPassword, 12)
    await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
      ['Administrator', String(adminEmail).toLowerCase(), hash]
    )
    console.log(`[GIS] Bootstrap admin created: ${adminEmail}`)
  }
}
