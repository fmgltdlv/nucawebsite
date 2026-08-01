import type { Env } from '../env'
import type { User } from '../config/roles'

import { hashPassword, randomSaltHex, verifyPassword } from './password'

type UserRow = {
  id: string
  email: string
  password_hash: string
  password_salt: string
  role: string
  display_name: string | null
  session_version: number
}

type UserPublicRow = {
  id: string
  email: string
  role: string
  display_name: string | null
  session_version: number
}

const USER_COLUMNS = `id, email, role, display_name, session_version`

function mapUser(row: UserPublicRow): User | null {
  if (row.role !== 'admin') return null
  return {
    id: row.id,
    email: row.email,
    role: 'admin',
    display_name: row.display_name,
    session_version: row.session_version,
  }
}

export async function countUsers(db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) as c FROM users').first<{ c: number }>()
  return row?.c ?? 0
}

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT id, email, password_hash, password_salt, role, display_name, session_version
       FROM users WHERE email = ?`,
    )
    .bind(email.toLowerCase().trim())
    .first<UserRow>()
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const row = await db
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`)
    .bind(id)
    .first<UserPublicRow>()
  return row ? mapUser(row) : null
}

export async function getSessionVersion(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare(`SELECT session_version FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ session_version: number }>()
  return row?.session_version ?? 0
}

export async function bumpSessionVersion(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare(
      `UPDATE users SET session_version = session_version + 1, updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(userId)
    .run()
}

export async function createUser(
  db: D1Database,
  email: string,
  password: string,
  opts?: { display_name?: string },
): Promise<string> {
  const id = crypto.randomUUID()
  const salt = randomSaltHex()
  const password_hash = await hashPassword(password, salt)

  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, password_salt, role, display_name)
       VALUES (?, ?, ?, ?, 'admin', ?)`,
    )
    .bind(id, email.toLowerCase().trim(), password_hash, salt, opts?.display_name ?? null)
    .run()
  return id
}

export async function verifyUserLogin(
  env: Env,
  email: string,
  password: string,
): Promise<User | null> {
  const row = await findUserByEmail(env.DB, email)
  if (!row || row.role !== 'admin') return null
  const ok = await verifyPassword(password, row.password_salt, row.password_hash)
  if (!ok) return null
  return mapUser(row)
}

export async function listUsers(db: D1Database): Promise<User[]> {
  const { results } = await db
    .prepare(`SELECT ${USER_COLUMNS} FROM users ORDER BY email`)
    .all<UserPublicRow>()
  return (results ?? []).map(mapUser).filter((user): user is User => user !== null)
}
