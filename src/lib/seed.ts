import type { Env } from '../env'
import { demoMembers } from '../data/demo'
import { countUsers, createUser } from './auth'

/** Seed first admin from Worker secrets when no users exist. */
export async function seedAdminIfNeeded(env: Env): Promise<void> {
  const count = await countUsers(env.DB)
  if (count > 0) return
  const email = env.ADMIN_EMAIL?.trim() || 'info@nucalasvegas.com'
  const password = env.ADMIN_PASSWORD
  if (!password) return
  await createUser(env.DB, email, password, 'admin', { display_name: 'Chapter Admin' })
}

export async function seedDemoMembersIfEmpty(env: Env): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) as c FROM members').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return
  let order = 0
  for (const m of demoMembers) {
    await env.DB
      .prepare(
        `INSERT INTO members (id, company_name, member_type, website, phone, active, display_order)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
      )
      .bind(
        m.id,
        m.company,
        m.type,
        m.website ?? null,
        m.phone ?? null,
        order++,
      )
      .run()
  }
}