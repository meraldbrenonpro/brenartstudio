"use client"

import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { m as motion, LazyMotion, domAnimation, MotionConfig } from "motion/react"
import { usePartnerMotion } from "./partner-motion"
import {
  PARTNER_DAILY_RATE, PARTNER_DOMAINS, PARTNER_INITIAL_MONTHS, PARTNER_MIN_DAYS, PARTNER_MAX_DAYS,
  formatPartnerEuros, getPartnerContactUrl, getPartnerQuote, normalisePartnerDays, type PartnerDomain,
} from "./partner-pricing"

// Keep the estimate during SPA navigation, in memory only.
let savedSelection: { days: number; domains: PartnerDomain[] } = { days: PARTNER_MIN_DAYS, domains: [] }

function PartnerConfigurator({ id, ready }: { id: string; ready(): void }) {
  const [days, setDays] = React.useState(savedSelection.days)
  const [domains, setDomains] = React.useState<PartnerDomain[]>(() => [...savedSelection.domains])
  const { tokens, springs, animate } = usePartnerMotion()
  const quote = getPartnerQuote(days)
  const volumeId = `partner-${id}-volume`
  const helpId = `partner-${id}-help`
  const budgetId = `partner-${id}-budget`
  const progress = (days - PARTNER_MIN_DAYS) / (PARTNER_MAX_DAYS - PARTNER_MIN_DAYS)

  React.useLayoutEffect(ready, [ready])
  React.useLayoutEffect(() => { savedSelection = { days, domains: [...domains] } }, [days, domains])

  const changeDays = (next: number) => setDays(normalisePartnerDays(next))
  const toggleDomain = (domain: PartnerDomain) => {
    setDomains((previous) => previous.includes(domain) ? previous.filter((item) => item !== domain) : [...previous, domain])
  }
  const press = animate ? { scale: tokens.scale.press } : undefined

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
      <div className="partner-configurator">
        <div className="partner-controls">
          <fieldset className="partner-field">
            <legend className="partner-legend">Jours par mois</legend>
            <p className="partner-help" id={helpId}>De 2 à 10 jours. Choisissez le rythme adapté à vos besoins.</p>
            <div className="partner-stepper">
              <motion.button type="button" className="partner-step" aria-label="Retirer un jour par mois"
                disabled={days <= PARTNER_MIN_DAYS} onClick={() => setDays((current) => normalisePartnerDays(current - 1))}
                whileTap={press} transition={springs.snappy}>
                <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M4 10h12" /></svg>
              </motion.button>
              <div className="partner-current-volume" aria-hidden="true"><strong className="partner-count">{days}</strong><span>jours / mois</span></div>
              <motion.button type="button" className="partner-step" aria-label="Ajouter un jour par mois"
                disabled={days >= PARTNER_MAX_DAYS} onClick={() => setDays((current) => normalisePartnerDays(current + 1))}
                whileTap={press} transition={springs.snappy}>
                <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M4 10h12M10 4v12" /></svg>
              </motion.button>
            </div>
            <div className="partner-range">
              <div className="partner-range-track" aria-hidden="true"><motion.span initial={false}
                animate={{ scaleX: progress }} transition={animate ? springs.snappy : { duration: 0 }} /></div>
              <label className="partner-sr-only" htmlFor={volumeId}>Nombre de jours par mois</label>
              <input id={volumeId} type="range" min={PARTNER_MIN_DAYS} max={PARTNER_MAX_DAYS} step="1" value={days}
                onChange={(event) => changeDays(Number(event.currentTarget.value))}
                aria-valuetext={`${days} jours par mois, ${formatPartnerEuros(quote.monthly)} HT par mois`}
                aria-describedby={helpId} />
            </div>
            <div className="partner-range-labels" aria-hidden="true"><span>2 jours</span><span>10 jours</span></div>
            <p className="partner-range-note">{formatPartnerEuros(PARTNER_DAILY_RATE)} HT par jour · Un seul tarif, tous domaines confondus.</p>
          </fieldset>
          <fieldset className="partner-field">
            <legend className="partner-legend">Domaines à explorer</legend>
            <p className="partner-help">Facultatif · À combiner selon vos priorités.</p>
            <div className="partner-domains">
              {PARTNER_DOMAINS.map(({ value, label }) => {
                const selected = domains.includes(value)
                return (
                  <motion.button key={value} type="button" className="partner-domain" aria-pressed={selected}
                    onClick={() => toggleDomain(value)} whileTap={press} transition={springs.snappy}>
                    <span className="partner-domain-check" aria-hidden="true">
                      <motion.svg viewBox="0 0 16 16" width="16" height="16" initial={false}
                        animate={{ opacity: selected ? 1 : 0, scale: animate && !selected ? tokens.scale.press : 1 }}
                        transition={{ duration: animate ? tokens.duration.fast : 0 }}><path d="m3 8 3 3 7-7" /></motion.svg>
                    </span>
                    {label}
                  </motion.button>
                )
              })}
            </div>
          </fieldset>
        </div>
        <aside className="partner-budget" aria-labelledby={budgetId}>
          <p className="partner-budget-label" id={budgetId}>Budget mensuel</p>
          <p className="partner-price" aria-hidden="true"><strong>{formatPartnerEuros(quote.monthly)}</strong><span>HT / mois</span></p>
          <p className="partner-calculation" aria-hidden="true">{days} jours × {formatPartnerEuros(PARTNER_DAILY_RATE)} HT</p>
          <div className="partner-projection" aria-hidden="true">
            <span>Sur les {PARTNER_INITIAL_MONTHS} premiers mois</span>
            <strong>{formatPartnerEuros(quote.initialTotal)} HT</strong>
            <small>Projection à volume constant.</small>
          </div>
          <p className="partner-sr-only" role="status" aria-live="polite" aria-atomic="true">
            {days} jours par mois : {formatPartnerEuros(quote.monthly)} HT par mois. Sur les {PARTNER_INITIAL_MONTHS} premiers mois à volume constant : {formatPartnerEuros(quote.initialTotal)} HT.
          </p>
          <motion.a className="partner-cta" href={getPartnerContactUrl(days, domains)} whileTap={press} transition={springs.snappy}>
            Parler de mon accompagnement<span aria-hidden="true">↗</span>
          </motion.a>
          <p className="partner-disclaimer">Estimation, volume et disponibilité confirmés au devis.</p>
        </aside>
      </div>
      </LazyMotion>
    </MotionConfig>
  )
}

const roots = new Map<HTMLElement, Root>()

function restoreFallback(host: HTMLElement) {
  const fallback = host.querySelector<HTMLElement>("[data-partner-fallback]")
  const mount = host.querySelector<HTMLElement>("[data-partner-mount]")
  if (fallback) fallback.hidden = false
  if (mount) mount.hidden = true
  delete host.dataset.partnerEnhanced
}

/** Separate React roots leave the React 18 x-dc shell and its routes untouched. */
export function mountPartner(host: HTMLElement) {
  if (roots.has(host) || !host.isConnected) return
  const mount = host.querySelector<HTMLElement>("[data-partner-mount]")
  const fallback = host.querySelector<HTMLElement>("[data-partner-fallback]")
  if (!mount || !fallback) return
  const root = createRoot(mount, { onUncaughtError: () => restoreFallback(host) })
  roots.set(host, root)
  const ready = () => {
    if (!host.isConnected) return
    fallback.hidden = true
    mount.hidden = false
    host.dataset.partnerEnhanced = "true"
  }
  root.render(<PartnerConfigurator id={host.dataset.partnerId || "studio"} ready={ready} />)
}

export function unmountPartner() {
  roots.forEach((root, host) => {
    root.unmount()
    restoreFallback(host)
  })
  roots.clear()
}
