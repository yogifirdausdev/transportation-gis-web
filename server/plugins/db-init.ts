import { ensureSchema } from '../utils/db'
import { ensureDataDirs } from '../utils/files'
export default defineNitroPlugin(async()=>{await ensureDataDirs();await ensureSchema()})
