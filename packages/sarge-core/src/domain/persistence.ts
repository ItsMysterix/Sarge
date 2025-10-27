export interface Transaction {
  put(key: string, value: Uint8Array): Promise<void>
  get(key: string): Promise<Uint8Array | undefined>
  del(key: string): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
}

export interface KeyValueStore {
  open(): Promise<void>
  close(): Promise<void>
  begin(): Promise<Transaction>
}

export interface LevelDBAdapter extends KeyValueStore {
  kind: 'leveldb'
  location: string
}

export interface SQLiteAdapter extends KeyValueStore {
  kind: 'sqlite'
  filePath: string
}
