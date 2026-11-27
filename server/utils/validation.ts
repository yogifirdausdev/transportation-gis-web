import { z } from 'zod'

const fieldLabels: Record<string, string> = {
  name: 'Nama',
  email: 'Email',
  password: 'Kata sandi',
  role: 'Peran',
  is_active: 'Status aktif',
  color: 'Warna',
  icon_key: 'Ikon'
}

function issueMessage(issue: z.ZodIssue) {
  const field = String(issue.path[0] ?? '')
  const label = fieldLabels[field] || field || 'Data'
  switch (issue.code) {
    case 'too_small':
      return issue.type === 'string'
        ? `${label} minimal ${issue.minimum} karakter`
        : `${label} terlalu kecil`
    case 'too_big':
      return issue.type === 'string'
        ? `${label} maksimal ${issue.maximum} karakter`
        : `${label} terlalu besar`
    case 'invalid_string':
      return issue.validation === 'email' ? 'Format email tidak valid' : `Format ${label.toLowerCase()} tidak valid`
    case 'invalid_enum_value':
      return `${label} tidak valid`
    case 'invalid_type':
      return issue.received === 'undefined' ? `${label} wajib diisi` : `${label} tidak valid`
    default:
      return `${label} tidak valid`
  }
}

// Parse request data with a zod schema; invalid input becomes a 400 with a readable message.
export function parseInput<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: issueMessage(result.error.issues[0]!) })
  }
  return result.data
}

// Turn a Postgres unique-constraint violation into a 409; rethrow anything else.
export function rethrowUnique(err: any, message: string): never {
  if (err?.code === '23505') throw createError({ statusCode: 409, statusMessage: message })
  throw err
}
