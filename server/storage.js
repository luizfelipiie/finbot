import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'finbot-data.json')
const BACKUP_PATH = `${DB_PATH}.bak`
const TMP_PATH = `${DB_PATH}.tmp`

const EMPTY = { profiles: [], accounts: [], transactions: [], goals: [], messages: [] }

let db = structuredClone(EMPTY)

// Throws on unreadable data instead of starting empty: an empty db would
// overwrite the file on the next save.
export function load() {
  if (!fs.existsSync(DB_PATH)) return
  try {
    db = { ...EMPTY, ...JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) }
  } catch (err) {
    throw new Error(
      `Could not read ${DB_PATH}. Restore it from ${BACKUP_PATH} before starting the API.`,
      { cause: err },
    )
  }
}

// Keeps the previous version as a backup and writes atomically (tmp + rename).
export function save() {
  if (fs.existsSync(DB_PATH)) fs.copyFileSync(DB_PATH, BACKUP_PATH)
  fs.writeFileSync(TMP_PATH, JSON.stringify(db, null, 2))
  fs.renameSync(TMP_PATH, DB_PATH)
}

export function getDb() { return db }
