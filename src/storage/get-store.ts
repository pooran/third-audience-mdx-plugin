import type { Store } from './store.js'
import { PostgresStore } from './postgres-store.js'

let _store: Store | null = null

export function getStore(): Store {
  if (_store) return _store
  _store = new PostgresStore()
  return _store
}
