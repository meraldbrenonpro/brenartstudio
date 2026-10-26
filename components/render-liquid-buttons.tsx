import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { LiquidButton } from "@/components/ui/liquid-glass-button"
import { LiquidNavigationPill } from "@/components/ui/liquid-glass-navigation"

// The site's own authored HTML is trusted. Keep its labels and attributes,
// including routing hooks, while rendering the shared React component at build time.
export function renderLiquidButtons(html: string) {
  html = html.replace(
    /<!--liquid-navigation-->[\s\S]*?<!--\/liquid-navigation-->|<span data-bs-navpill="1" aria-hidden="true"><\/span>/,
    `<!--liquid-navigation-->${renderToStaticMarkup(<LiquidNavigationPill />)}<!--/liquid-navigation-->`,
  )
  let index = 0
  return html.replace(/<a\b([^>]*\bclass="[^"]*\brd-button\b[^"]*"[^>]*)>([\s\S]*?)<\/a>/g,
    (_anchor, attributes: string, content: string) => {
      const props: Record<string, string> = {}
      const attributePattern = /([\w:-]+)="([^"]*)"/g
      for (const attribute of attributes.matchAll(attributePattern)) {
        const name = attribute[1] === "class" ? "className" : attribute[1]
        props[name] = attribute[2].replace(/&quot;/g, '"').replace(/&amp;/g, "&")
      }
      // Builds read index.html back in. Recover the authored classes/label so
      // filters and decoration never accumulate, even after component changes.
      props.className = props["data-liquid-class"] || props.className
      props["data-liquid-class"] = props.className
      props["data-liquid-button"] = ""
      delete props["data-slot"]
      delete props.style
      const label = content.match(/<!--liquid-label-->([\s\S]*?)<!--\/liquid-label-->/)?.[1] || content
      return renderToStaticMarkup(
        <LiquidButton asChild size="xl" filterId={`site-${++index}`}>
          <a {...props}>
            <span data-liquid-label="" dangerouslySetInnerHTML={{
              __html: `<!--liquid-label-->${label}<!--/liquid-label-->`,
            }} />
          </a>
        </LiquidButton>,
      )
    },
  )
}
