/** The configurator estimates reserved production time, never a deliverable count. */
export const PARTNER_DAILY_RATE = 400
export const PARTNER_MIN_DAYS = 2
export const PARTNER_MAX_DAYS = 10
export const PARTNER_INITIAL_MONTHS = 3

export const PARTNER_DOMAINS = [
  { value: "3d", label: "Visuels 3D & CGI" },
  { value: "motion", label: "Animation" },
  { value: "identite", label: "Identité & DA" },
  { value: "web", label: "Web" },
] as const

export type PartnerDomain = typeof PARTNER_DOMAINS[number]["value"]

export function normalisePartnerDays(value: unknown): number {
  const number = typeof value === "number" || typeof value === "string" ? Number(value) : NaN
  if (!Number.isFinite(number)) return PARTNER_MIN_DAYS
  return Math.min(PARTNER_MAX_DAYS, Math.max(PARTNER_MIN_DAYS, Math.round(number)))
}

export function getPartnerQuote(value: unknown = PARTNER_MIN_DAYS) {
  const days = normalisePartnerDays(value)
  const monthly = days * PARTNER_DAILY_RATE
  return { days, monthly, initialTotal: monthly * PARTNER_INITIAL_MONTHS }
}

export function getPartnerContactUrl(days: unknown, domains: readonly string[] = []): string {
  const selected = PARTNER_DOMAINS.filter(({ value }) => domains.includes(value)).map(({ value }) => value)
  const params = new URLSearchParams({ type: "studio-partenaire", jours: String(normalisePartnerDays(days)) })
  if (selected.length) params.set("domaines", selected.join(","))
  return `/contact?${params.toString()}#bs-type`
}

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency", currency: "EUR", maximumFractionDigits: 0,
})

export function formatPartnerEuros(amount: number): string {
  return euroFormatter.format(amount)
}
