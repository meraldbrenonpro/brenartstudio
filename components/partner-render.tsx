import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import {
  PARTNER_DAILY_RATE, PARTNER_DOMAINS, PARTNER_INITIAL_MONTHS,
  formatPartnerEuros, getPartnerContactUrl, getPartnerQuote,
} from "./partner-pricing"

/** Authored HTML remains useful before enhancement, with JS blocked or on error. */
export function renderPartnerConfigurator({ id }: { id: string }): string {
  if (!/^[a-z][a-z0-9-]*$/i.test(id)) throw new Error("Invalid partner configurator id")
  const quote = getPartnerQuote()
  return renderToStaticMarkup(
    <div className="partner-configurator-host" data-partner-configurator="" data-partner-id={id}>
      <div className="partner-configurator" data-partner-fallback="">
        <div className="partner-controls">
          <div className="partner-field">
            <h3 className="partner-legend">Jours par mois</h3>
            <p className="partner-help">Un point de départ de 2 jours, à ajuster ensemble selon vos besoins.</p>
            <div className="partner-stepper partner-stepper--static">
              <strong className="partner-count">2</strong><span>jours / mois</span>
            </div>
            <p className="partner-range-note">{formatPartnerEuros(PARTNER_DAILY_RATE)} HT par jour · Un seul tarif, tous domaines confondus.</p>
          </div>
          <div className="partner-field">
            <h3 className="partner-legend">Domaines à explorer</h3>
            <p className="partner-help">À combiner selon vos priorités.</p>
            <div className="partner-domains partner-domains--static">
              {PARTNER_DOMAINS.map(({ value, label }) => <span className="partner-domain-label" key={value}>{label}</span>)}
            </div>
          </div>
        </div>
        <aside className="partner-budget" aria-label="Estimation de départ">
          <p className="partner-budget-label">Budget mensuel</p>
          <p className="partner-price"><strong>{formatPartnerEuros(quote.monthly)}</strong><span>HT / mois</span></p>
          <p className="partner-calculation">2 jours × {formatPartnerEuros(PARTNER_DAILY_RATE)} HT</p>
          <div className="partner-projection">
            <span>Sur les {PARTNER_INITIAL_MONTHS} premiers mois</span>
            <strong>{formatPartnerEuros(quote.initialTotal)} HT</strong>
            <small>Projection à volume constant.</small>
          </div>
          <a className="partner-cta" href={getPartnerContactUrl(quote.days)}>Parler de mon accompagnement<span aria-hidden="true">↗</span></a>
          <p className="partner-disclaimer">Estimation, volume et disponibilité confirmés au devis.</p>
        </aside>
      </div>
      <div data-partner-mount="" hidden />
    </div>,
  )
}
