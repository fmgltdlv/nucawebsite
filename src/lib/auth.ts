import type { Env } from '../env'
import type { User, UserRole } from '../config/roles'

import { hashPassword, randomSaltHex, verifyPassword } from './password'

type UserRow = {
  id: string
  email: string
  password_hash: string
  password_salt: string
  role: UserRole
  member_id: string | null
  display_name: string | null
}

type UserPublicRow = {
  id: string
  email: string
  role: UserRole
  member_id: string | null
  display_name: string | null
}

function mapUser(row: UserPublicRow): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    member_id: row.member_id,
    display_name: row.display_name,
  }
}

function mapUserRow(row: UserRow): User {
  return mapUser(row)
}

export async function countUsers(db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) as c FROM users').first<{ c: number }>()
  return row?.c ?? 0
}

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT id, email, password_hash, password_salt, role, member_id, display_name
       FROM users WHERE email = ?`,
    )
    .bind(email.toLowerCase().trim())
    .first<UserRow>()
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const row = await db
    .prepare(
      `SELECT id, email, password_hash, password_salt, role, member_id, display_name
       FROM users WHERE id = ?`,
    )
    .bind(id)
    .first<UserRow>()
  return row ? mapUserRow(row) : null
}

export async function createUser(
  db: D1Database,
  email: string,
  password: string,
  role: UserRole,
  opts?: { member_id?: string; display_name?: string },
): Promise<string> {
  const id = crypto.randomUUID()
  const salt = randomSaltHex()
  const password_hash = await hashPassword(password, salt)
  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, password_salt, role, member_id, display_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      email.toLowerCase().trim(),
      password_hash,
      salt,
      role,
      opts?.member_id ?? null,
      opts?.display_name ?? null,
    )
    .run()
  return id
}

export async function verifyUserLogin(
  env: Env,
  email: string,
  password: string,
): Promise<User | null> {
  const row = await findUserByEmail(env.DB, email)
  if (!row) return null
  const ok = await verifyPassword(password, row.password_salt, row.password_hash)
  if (!ok) return null
  return mapUserRow(row)
}

export async function listChairCommittees(db: D1Database, userId: string): Promise<string[]> {
  const { results } = await db
    .prepare('SELECT committee_key FROM chair_committee_assignments WHERE user_id = ?')
    .bind(userId)
    .all<{ committee_key: string }>()
  return (results ?? []).map((r) => r.committee_key)
}

export async function listUsers(db: D1Database): Promise<User[]> {
  const { results } = await db
    .prepare(
      `SELECT id, email, role, member_id, display_name FROM users ORDER BY role, email`,
    )
    .all<UserPublicRow>()
  return (results ?? []).map(mapUser)
}

export async function assignChairCommittees(
  db: D1Database,
  userId: string,
  committeeKeys: string[],
): Promise<void> {
  await db.prepare('DELETE FROM chair_committee_assignments WHERE user_id = ?').bind(userId).run()
  for (const key of committeeKeys) {
    await db
      .prepare('INSERT INTO chair_committee_assignments (user_id, committee_key) VALUES (?, ?)')
      .bind(userId, key)
      .run()
  }
}
