import type { MemberContact } from '../data/demo'

export const MAX_MEMBER_POINTS_OF_CONTACT = 5

export function isMemberContactEmpty(contact: MemberContact): boolean {
  return !contact.name.trim() && !contact.email.trim()
}

export function visibleMemberContacts(contacts: MemberContact[]): MemberContact[] {
  return contacts.filter((contact) => !isMemberContactEmpty(contact))
}

export function parsePointsOfContactJson(json: string | null | undefined): MemberContact[] {
  if (!json?.trim()) return []
  try {
    const parsed: unknown = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed
      .slice(0, MAX_MEMBER_POINTS_OF_CONTACT)
      .map((entry) => {
        const row = entry as { name?: unknown; email?: unknown }
        const name = typeof row.name === 'string' ? row.name.trim() : ''
        const email = typeof row.email === 'string' ? row.email.trim() : ''
        return { name, email }
      })
      .filter((contact) => !isMemberContactEmpty(contact))
      .map((contact) => ({
        name: contact.name || contact.email,
        email: contact.email,
      }))
  } catch {
    return []
  }
}

export function serializePointsOfContact(contacts: MemberContact[]): string | null {
  const visible = visibleMemberContacts(contacts).slice(0, MAX_MEMBER_POINTS_OF_CONTACT)
  return visible.length > 0 ? JSON.stringify(visible) : null
}

export function parsePointsOfContactFromForm(
  body: Record<string, File | string>,
): MemberContact[] {
  const contacts: MemberContact[] = []
  for (let i = 0; i < MAX_MEMBER_POINTS_OF_CONTACT; i++) {
    const nameKey = `poc_${i}_name`
    const emailKey = `poc_${i}_email`
    const name = typeof body[nameKey] === 'string' ? body[nameKey].trim() : ''
    const email = typeof body[emailKey] === 'string' ? body[emailKey].trim() : ''
    if (isMemberContactEmpty({ name, email })) continue
    contacts.push({
      name: name || email,
      email,
    })
  }
  return contacts
}

export function padPointsOfContact(contacts: MemberContact[]): MemberContact[] {
  const padded = contacts.slice(0, MAX_MEMBER_POINTS_OF_CONTACT).map((contact) => ({
    name: contact.name ?? '',
    email: contact.email ?? '',
  }))
  while (padded.length < MAX_MEMBER_POINTS_OF_CONTACT) {
    padded.push({ name: '', email: '' })
  }
  return padded
}
