"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Home, Layers, Sparkles, User, MessageCircle, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { bottomNavItems, activeBottomNavIndex } from "@/lib/bottom-navigation"
import { usePartnerMotion as useSiteMotion } from "@/components/partner-motion"

const icons = { home: Home, projects: Layers, services: Sparkles, studio: User, contact: MessageCircle }
const navItems = bottomNavItems.map(item => ({ ...item, icon: icons[item.icon] }))

export type BottomNavItem = { label: string; shortLabel?: string; href: string; icon: LucideIcon }
export type BottomNavBarProps = {
  className?: string
  defaultIndex?: number
  stickyBottom?: boolean
  items?: readonly BottomNavItem[]
  /** Controlled route state; omit for a standalone, locally selected demo. */
  currentPath?: string
  onActiveChange?: (index: number) => void
}

/** Native links keep routing, open-in-new-tab and keyboard behavior intact. */
export function BottomNavBar({
  className, defaultIndex = 0, stickyBottom = false,
  items = navItems, currentPath, onActiveChange,
}: BottomNavBarProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex)
  const { animate, tokens, springs } = useSiteMotion()
  const selected = currentPath === undefined ? activeIndex :
    items === navItems ? activeBottomNavIndex(currentPath) :
      items.findIndex(item => item.href === currentPath)

  return (
    <motion.nav
      initial={false}
      layoutRoot={stickyBottom}
      aria-label="Navigation rapide"
      className={cn(
        "br-bottom-nav bg-card text-foreground border border-border rounded-full",
        stickyBottom && "br-bottom-nav--fixed",
        className,
      )}
    >
      {items.map((item, index) => {
        const Icon = item.icon
        const isActive = selected === index
        return (
          <motion.a
            key={item.href}
            href={item.href}
            layout={animate}
            initial={false}
            whileTap={animate ? { scale: tokens.scale.press } : undefined}
            transition={animate ? springs.snappy : { duration: 0 }}
            className="br-bottom-nav-link"
            data-active={isActive ? "true" : "false"}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
            onClick={event => {
              if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
              if (currentPath === undefined) setActiveIndex(index)
              onActiveChange?.(index)
            }}
          >
            <motion.span layout={animate ? "position" : false} className="br-bottom-nav-icon" aria-hidden="true">
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            </motion.span>
            <motion.span
              initial={false}
              layout={animate ? "position" : false}
              animate={{ opacity: 1 }}
              transition={{ duration: tokens.duration.fast }}
              className="br-bottom-nav-label"
              aria-hidden="true"
            >{item.shortLabel ?? item.label}</motion.span>
          </motion.a>
        )
      })}
    </motion.nav>
  )
}

export default BottomNavBar
