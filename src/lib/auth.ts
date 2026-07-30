import type { Env } from '../env'
import type { MemberLinkStatus, User, UserRole, UserWithMemberInfo } from '../config/roles'

import { hashPassword, randomSaltHex, verifyPassword } from './password'

type UserRow = {
  id: string
  email: string
  password_hash: string
  password_salt: string
  role: UserRole
  member_id: string | null
  pending_member_id: string | null
  member_link_status: MemberLinkStatus
  display_name: string | null
}

type UserPublicRow = {
  id: string
  email: string
  role: UserRole
  member_id: string | null
  pending_member_id: string | null
  member_link_status: MemberLinkStatus
  display_name: string | null
}

type UserWithMemberInfoRow = UserPublicRow & {
  member_company: string | null
  pending_company: string | null
}

const USER_COLUMNS = `id, email, role, member_id, pending_member_id, member_link_status, display_name`

function mapUser(row: UserPublicRow): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    member_id: row.member_id,
    pending_member_id: row.pending_member_id,
    member_link_status: row.member_link_status,
    display_name: row.display_name,
  }
}

function mapUserRow(row: UserRow): User {
  return mapUser(row)
}

function mapUserWithMemberInfo(row: UserWithMemberInfoRow): UserWithMemberInfo {
  return {
    ...mapUser(row),
    member_company: row.member_company,
    pending_company: row.pending_company,
  }
}

export async function countUsers(db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) as c FROM users').first<{ c: number }>()
  return row?.c ?? 0
}

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT id, email, password_hash, password_salt, role, member_id, pending_member_id,
              member_link_status, display_name
       FROM users WHERE email = ?`,
    )
    .bind(email.toLowerCase().trim())
    .first<UserRow>()
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const row = await db
    .prepare(
      `SELECT id, email, password_hash, password_salt, role, member_id, pending_member_id,
              member_link_status, display_name
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
  const member_id = opts?.member_id ?? null
  const member_link_status: MemberLinkStatus = member_id ? 'approved' : 'none'

  await db
    .prepare(
      `INSERT INTO users (
         id, email, password_hash, password_salt, role, member_id,
         pending_member_id, member_link_status, display_name
       )
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    )
    .bind(
      id,
      email.toLowerCase().trim(),
      password_hash,
      salt,
      role,
      member_id,
      member_link_status,
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
    .prepare(`SELECT ${USER_COLUMNS} FROM users ORDER BY role, email`)
    .all<UserPublicRow>()
  return (results ?? []).map(mapUser)
}

export async function listUsersWithMemberInfo(db: D1Database): Promise<UserWithMemberInfo[]> {
  const { results } = await db
    .prepare(
      `SELECT u.id, u.email, u.role, u.member_id, u.pending_member_id, u.member_link_status,
              u.display_name,
              m.company_name AS member_company,
              pm.company_name AS pending_company
       FROM users u
       LEFT JOIN members m ON m.id = u.member_id
       LEFT JOIN members pm ON pm.id = u.pending_member_id
       ORDER BY
         CASE WHEN u.member_link_status = 'pending' THEN 0 ELSE 1 END,
         u.role,
         u.email`,
    )
    .all<UserWithMemberInfoRow>()
  return (results ?? []).map(mapUserWithMemberInfo)
}

export async function requestMemberLink(
  db: D1Database,
  userId: string,
  memberId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getUserById(db, userId)
  if (!user || user.role !== 'member') {
    return { ok: false, error: 'Only member accounts can request a company link.' }
  }

  if (user.member_link_status === 'pending') {
    return { ok: false, error: 'You already have a pending company change.' }
  }

  if (user.member_id === memberId) {
    return { ok: false, error: 'You are already linked to that company.' }
  }

  const member = await db
    .prepare('SELECT id FROM members WHERE id = ? AND active = 1')
    .bind(memberId)
    .first<{ id: string }>()
  if (!member) {
    return { ok: false, error: 'That company was not found.' }
  }

  await db
    .prepare(
      `UPDATE users
       SET pending_member_id = ?, member_link_status = 'pending', updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(memberId, userId)
    .run()

  return { ok: true }
}

export async function approveMemberLink(
  db: D1Database,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getUserById(db, userId)
  if (!user) return { ok: false, error: 'User not found.' }
  if (user.member_link_status !== 'pending' || !user.pending_member_id) {
    return { ok: false, error: 'No pending company link for this user.' }
  }

  await db
    .prepare(
      `UPDATE users
       SET member_id = pending_member_id,
           pending_member_id = NULL,
           member_link_status = 'approved',
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(userId)
    .run()

  return { ok: true }
}

export async function rejectMemberLink(
  db: D1Database,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getUserById(db, userId)
  if (!user) return { ok: false, error: 'User not found.' }
  if (user.member_link_status !== 'pending' || !user.pending_member_id) {
    return { ok: false, error: 'No pending company link for this user.' }
  }

  await db
    .prepare(
      `UPDATE users
       SET pending_member_id = NULL,
           member_link_status = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(user.member_id ? 'approved' : 'rejected', userId)
    .run()

  return { ok: true }
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
