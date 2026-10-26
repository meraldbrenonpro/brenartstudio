"use client"

import { DotField } from "@/components/ui/dot-field"
import { LiquidButton } from "@/components/ui/liquid-glass-button"

export default function DotFieldDemo() {
  return (
    <DotField
      headline="Votre marque. Une vraie personnalité."
      eyebrow="Bren’Art Studio · Design indépendant à Toulouse"
      description="Identité visuelle, site web, communication. Je donne une même direction à votre image."
      accent="#2d46f5"
      fontFamily="system-ui, sans-serif"
      fontWeight={600}
      scrollHint={{ scatter: "Défiler pour disperser", gather: "Remonter pour rassembler" }}
      actions={
        <LiquidButton asChild size="xl">
          <a href="/contact">Parlons de votre projet</a>
        </LiquidButton>
      }
    />
  )
}
