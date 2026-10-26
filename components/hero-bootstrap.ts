import { installHeroStartup } from "@/lib/hero-startup"

declare const __DOT_FIELD_MODULE__: string

// Runs in <head>, before the hero can paint. No JavaScript means no concealment.
if ((location.pathname.replace(/\/+$/, "") || "/") === "/") {
  installHeroStartup(__DOT_FIELD_MODULE__).prepare()
}
