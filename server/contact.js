import { Resend } from 'resend'

const ALLOWED_TYPES = ['brand', 'web', 'brand-web', 'autre']
const MAX_NOM = 200
const MAX_EMAIL = 200
const MAX_MESSAGE = 5000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const requestLog = new Map()

function isRateLimited(ip) {
  const now = Date.now()
  const recent = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  recent.push(now)
  requestLog.set(ip, recent)
  return recent.length > RATE_LIMIT_MAX
}

function validate(body) {
  const { nom, email, type, message } = body
  if (typeof nom !== 'string' || nom.trim() === '' || nom.length > MAX_NOM) {
    return 'Le nom est requis.'
  }
  if (typeof email !== 'string' || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return "L'email est invalide."
  }
  if (typeof type !== 'string' || !ALLOWED_TYPES.includes(type)) {
    return 'Le type de projet est invalide.'
  }
  if (typeof message !== 'string' || message.trim() === '' || message.length > MAX_MESSAGE) {
    return 'Le message est requis.'
  }
  return null
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

function buildEmail({ nom, email, type, budget, message }) {
  const html = `
    <h2>Nouveau message de contact</h2>
    <p><strong>Nom :</strong> ${escapeHtml(nom)}</p>
    <p><strong>Email :</strong> ${escapeHtml(email)}</p>
    <p><strong>Type de projet :</strong> ${escapeHtml(type)}</p>
    <p><strong>Budget :</strong> ${escapeHtml(budget || 'Non précisé')}</p>
    <p><strong>Message :</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
  `
  const text = [
    `Nom: ${nom}`,
    `Email: ${email}`,
    `Type: ${type}`,
    `Budget: ${budget || 'Non précisé'}`,
    '',
    'Message:',
    message,
  ].join('\n')

  return { html, text }
}

export function createContactHandler({ resendApiKey, from, to }) {
  let resend = null

  return async (c) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown'

    let body
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Corps de requête JSON invalide.' }, 400)
    }

    if (body.website) {
      return c.json({ ok: true })
    }

    const validationError = validate(body)
    if (validationError) {
      return c.json({ error: validationError }, 400)
    }

    if (isRateLimited(ip)) {
      return c.json({ error: 'Trop de requêtes, réessayez plus tard.' }, 429)
    }

    const { nom, email, type, budget, message } = body
    const { html, text } = buildEmail({ nom, email, type, budget, message })

    if (!resendApiKey) {
      console.error('Contact send failed: RESEND_API_KEY is not configured')
      return c.json({ error: "Échec de l'envoi." }, 500)
    }

    try {
      resend ??= new Resend(resendApiKey)
      const { error } = await resend.emails.send(
        {
          from,
          to,
          replyTo: email,
          subject: `Nouveau contact — ${nom}`,
          html,
          text,
        },
        { idempotencyKey: crypto.randomUUID() }
      )

      if (error) {
        console.error('Resend error:', error)
        return c.json({ error: "Échec de l'envoi." }, 500)
      }

      return c.json({ ok: true })
    } catch (err) {
      console.error('Contact send failed:', err)
      return c.json({ error: "Échec de l'envoi." }, 500)
    }
  }
}
