import crypto from 'crypto'
import { getStore } from '../storage/get-store.js'

export type { AdminRecord } from '../storage/store.js'

export function generateDefaultPassword(): string {
  return crypto.randomBytes(6).toString('hex')
}

export function hashPassword(password: string): string {
  const secret = process.env.THIRD_AUDIENCE_SECRET ?? 'ta-salt'
  return crypto.createHash('sha256').update(secret + password).digest('hex')
}

export const DEFAULT_PASSWORD = 'Chang3M3Now!'

// ---------------------------------------------------------------------------
// Admin record — delegated to storage backend
// ---------------------------------------------------------------------------

export function loadAdmin() {
  return getStore().getAdmin()
}

export function saveAdmin(record: Parameters<ReturnType<typeof getStore>['saveAdmin']>[0]) {
  return getStore().saveAdmin(record)
}

export async function initAdmin(): Promise<{ password: string; apiKey: string; isNew: boolean }> {
  const existing = await getStore().getAdmin()
  if (existing) return { password: '', apiKey: '', isNew: false }

  const apiKey = generateApiKey()
  await getStore().saveAdmin({
    passwordHash: hashPassword(DEFAULT_PASSWORD),
    isDefaultPassword: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    apiKey: encryptApiKey(apiKey),
  })
  return { password: DEFAULT_PASSWORD, apiKey, isNew: true }
}

export async function verifyPassword(password: string): Promise<boolean> {
  const record = await getStore().getAdmin()
  if (!record) return false
  return record.passwordHash === hashPassword(password)
}

export async function updatePassword(newPassword: string): Promise<void> {
  const record = await getStore().getAdmin()
  if (!record) return
  await getStore().saveAdmin({ ...record, passwordHash: hashPassword(newPassword), isDefaultPassword: false })
}

export async function recordLogin(): Promise<void> {
  const record = await getStore().getAdmin()
  if (!record) return
  await getStore().saveAdmin({ ...record, lastLoginAt: new Date().toISOString() })
}

// ---------------------------------------------------------------------------
// API key — AES-256-GCM encrypted at rest
// ---------------------------------------------------------------------------

const CIPHER = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const secret = process.env.THIRD_AUDIENCE_SECRET ?? 'ta-fallback-key-change-me'
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptApiKey(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(CIPHER, key, iv) as crypto.CipherGCM
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return iv.toString('hex') + tag.toString('hex') + encrypted.toString('hex')
}

export function decryptApiKey(encoded: string): string | null {
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
  return 'ta_' + crypto.randomBytes(24).toString('hex')
}

export async function getApiKey(): Promise<string | null> {
  const record = await getStore().getAdmin()
  if (!record?.apiKey) return null
  return decryptApiKey(record.apiKey)
}

export async function rotateApiKey(): Promise<string> {
  const record = await getStore().getAdmin()
  if (!record) throw new Error('Admin store not initialised')
  const newKey = generateApiKey()
  await getStore().saveAdmin({ ...record, apiKey: encryptApiKey(newKey) })
  return newKey
}

export async function verifyApiKey(key: string): Promise<boolean> {
  const stored = await getApiKey()
  if (!stored) return false
  if (key.length !== stored.length) return false
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(stored))
}

// ---------------------------------------------------------------------------
// Session cookie — stateless HMAC, no DB needed
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
  if (sig.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
}
