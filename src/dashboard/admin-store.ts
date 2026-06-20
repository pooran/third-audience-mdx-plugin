import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export interface AdminRecord {
  passwordHash: string        // sha256(secret + password)
  isDefaultPassword: boolean
  createdAt: string
  lastLoginAt: string | null
  apiKey?: string             // AES-256-GCM encrypted, for headless/external API callers
}

function adminFilePath(): string {
  const dataDir = process.env.TA_DATA_DIR ?? 'data'
  return path.join(process.cwd(), dataDir, 'ta-admin.json')
}

export function generateDefaultPassword(): string {
  return crypto.randomBytes(6).toString('hex') // 12-char hex, easy to type
}

export function hashPassword(password: string): string {
  const secret = process.env.THIRD_AUDIENCE_SECRET ?? 'ta-salt'
  return crypto.createHash('sha256').update(secret + password).digest('hex')
}

export function loadAdmin(): AdminRecord | null {
  const filePath = adminFilePath()
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as AdminRecord
  } catch {
    return null
  }
}

export function saveAdmin(record: AdminRecord): void {
  const filePath = adminFilePath()
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8')
}

export const DEFAULT_PASSWORD = 'Chang3M3Now!'

export function initAdmin(): { password: string; apiKey: string; isNew: boolean } {
  const existing = loadAdmin()
  if (existing) return { password: '', apiKey: '', isNew: false }

  const apiKey = generateApiKey()
  saveAdmin({
    passwordHash: hashPassword(DEFAULT_PASSWORD),
    isDefaultPassword: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    apiKey: encryptApiKey(apiKey),
  })
  return { password: DEFAULT_PASSWORD, apiKey, isNew: true }
}

export function verifyPassword(password: string): boolean {
  const record = loadAdmin()
  if (!record) return false
  return record.passwordHash === hashPassword(password)
}

export function updatePassword(newPassword: string): void {
  const record = loadAdmin()
  if (!record) return
  saveAdmin({
    ...record,
    passwordHash: hashPassword(newPassword),
    isDefaultPassword: false,
  })
}

export function recordLogin(): void {
  const record = loadAdmin()
  if (!record) return
  saveAdmin({ ...record, lastLoginAt: new Date().toISOString() })
}

// ---------------------------------------------------------------------------
// API key — AES-256-GCM encrypted at rest, mirroring WP's SECURE_AUTH_KEY approach
// ---------------------------------------------------------------------------

const CIPHER = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const secret = process.env.THIRD_AUDIENCE_SECRET ?? 'ta-fallback-key-change-me'
  // Derive a 32-byte key from the secret using SHA-256
  return crypto.createHash('sha256').update(secret).digest()
}

function encryptApiKey(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(CIPHER, key, iv) as crypto.CipherGCM
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: iv(24 hex) + tag(32 hex) + encrypted(hex)
  return iv.toString('hex') + tag.toString('hex') + encrypted.toString('hex')
}

function decryptApiKey(encoded: string): string | null {
  try {
    const iv = Buffer.from(encoded.slice(0, 24), 'hex')
    const tag = Buffer.from(encoded.slice(24, 56), 'hex')
    const encrypted = Buffer.from(encoded.slice(56), 'hex')
    const key = getEncryptionKey()
    const decipher = crypto.createDecipheriv(CIPHER, key, iv) as crypto.DecipherGCM
    decipher.setAuthTag(tag)
    return decipher.update(encrypted) + decipher.final('utf8')
  } catch {
    return null
  }
}

export function generateApiKey(): string {
  return 'ta_' + crypto.randomBytes(24).toString('hex') // 51-char key
}

export function getApiKey(): string | null {
  const record = loadAdmin()
  if (!record?.apiKey) return null
  return decryptApiKey(record.apiKey)
}

export function rotateApiKey(): string {
  const record = loadAdmin()
  if (!record) throw new Error('Admin store not initialised')
  const newKey = generateApiKey()
  saveAdmin({ ...record, apiKey: encryptApiKey(newKey) })
  return newKey
}

export function verifyApiKey(key: string): boolean {
  const stored = getApiKey()
  if (!stored) return false
  if (key.length !== stored.length) return false
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(stored))
}

// ---------------------------------------------------------------------------
// Session cookie: HMAC-SHA256(secret, userId + timestamp) — stateless, no DB
// ---------------------------------------------------------------------------
export function signSession(payload: string): string {
  const secret = process.env.THIRD_AUDIENCE_SECRET ?? 'ta-salt'
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifySession(token: string): boolean {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return false
  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  const expected = crypto.createHmac('sha256', process.env.THIRD_AUDIENCE_SECRET ?? 'ta-salt')
    .update(payload).digest('hex')
  // Constant-time comparison
  if (sig.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
}
