import type { Env } from '../env'
import { getContactInfo } from './site-settings'

export async function sendContactMessage(
  env: Env,
  data: { name: string; email: string; message: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!env.EMAIL) {
    return { ok: false, error: 'Email service is not configured.' }
  }

  const contact = await getContactInfo(env.DB)
  const to = contact.email

  try {
    await env.EMAIL.send({
      to,
      from: 'NUCA Website <noreply@nucalasvegas.com>',
      replyTo: data.email,
      subject: `Contact form: ${data.name}`,
      text: `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`,
    })
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not send your message. Please try calling the chapter.' }
  }
}

export async function notifyStaffOfApplication(
  env: Env,
  applicationId: string,
  summary: string,
): Promise<void> {
  if (!env.EMAIL) return
  const contact = await getContactInfo(env.DB)
  try {
    await env.EMAIL.send({
      to: contact.email,
      from: 'NUCA Website <noreply@nucalasvegas.com>',
      subject: `New membership application (${applicationId.slice(0, 8)})`,
      text: summary,
    })
  } catch {
    /* non-fatal */
  }
}
