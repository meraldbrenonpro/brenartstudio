/** The bottom bar follows real routes, including every project detail page. */
export const bottomNavItems = [
  { label: "Accueil", href: "/", icon: "home" },
  { label: "Projets", href: "/portfolio", icon: "projects" },
  { label: "Expertises", shortLabel: "Services", href: "/services", icon: "services" },
  { label: "Le studio", shortLabel: "Studio", href: "/a-propos", icon: "studio" },
  { label: "Contact", href: "/contact", icon: "contact" },
] as const

export function activeBottomNavIndex(path: string): number {
  const pathname = path.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/"
  return bottomNavItems.findIndex(({ href }) => pathname === href ||
    (href === "/portfolio" && pathname.startsWith("/portfolio/")))
}
