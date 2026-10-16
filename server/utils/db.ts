import pg from 'pg'
const { Pool } = pg
let pool: any = null
export function db() {
  if (!pool) {
    const config = useRuntimeConfig()
    if (!config.databaseUrl) throw new Error('DATABASE_URL is not configured')
    pool = new Pool({ connectionString: config.databaseUrl as string })
  }
  return pool
}
export async function q(text: string, params: any[] = []) { return db().query(text, params) }
