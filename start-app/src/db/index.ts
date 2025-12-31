import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema/index'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const dbPath = './data/dev.db'

// Ensure the data directory exists
const dir = dirname(dbPath)
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true })
}

const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })

// Re-export schema types
export * from './schema/index'
