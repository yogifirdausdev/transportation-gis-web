import pg from 'pg'

const { Pool } = pg
const globalForDb = globalThis as unknown as { gisPool?: pg.Pool }

const pool = globalForDb.gisPool || new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://gis:gis@localhost:5432/gis',
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
})

if (process.env.NODE_ENV !== 'production') globalForDb.gisPool = pool
export const db = pool
