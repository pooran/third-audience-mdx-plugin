import type { Store } from './store.js'

let _store: Store | null = null

export function getStore(): Store {
  if (_store) return _store

  const type = process.env.TA_STORAGE_TYPE ?? 'sqlite'

  if (type === 'postgres' || type === 'supabase') {
    const { PostgresStore } = require('./postgres-store.js') as typeof import('./postgres-store.js')
    _store = new PostgresStore()
  } else {
    const { SqliteStore } = require('./sqlite-store.js') as typeof import('./sqlite-store.js')
    _store = new SqliteStore()
  }

  return _store!
}
