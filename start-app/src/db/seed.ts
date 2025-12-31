import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const dbPath = './data/dev.db'

const sqlite = new Database(dbPath)
const db = drizzle(sqlite, { schema })

console.log('🌱 Seeding database...')

// Clear existing data from all tables
console.log('  Clearing existing data...')
sqlite.exec(`
  DELETE FROM updates;
  DELETE FROM sprint_reviews;
  DELETE FROM issue_relationships;
  DELETE FROM issues;
  DELETE FROM sprints;
  DELETE FROM projects;
  DELETE FROM teams;
  DELETE FROM team_members;
  DELETE FROM issue_templates;
  DELETE FROM automations;
  DELETE FROM analytics_cache;
  DELETE FROM provider_credentials;
  DELETE FROM users;
  DELETE FROM project_members;
`)

console.log('✅ Database cleared - Starting fresh with no data!')
sqlite.close()
