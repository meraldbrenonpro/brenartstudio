"use client"

import * as React from 'react'
import { createMagneticCursor, type MagneticCursorOptions } from '@/lib/magnetic-cursor'

export interface MagneticCursorProps extends MagneticCursorOptions {
  children?: React.ReactNode
  cursorClassName?: string
}

/** React adapter for the same controller used by the site's static shell.
 * Import the shared cursor stylesheet once in a standalone React application.
 * Children keep their existing layout, DOM ownership and event handlers.
 */
export function MagneticCursor({ children, cursorClassName = '', ...options }: MagneticCursorProps) {
  // Only primitive configuration is accepted by this effect; no render/frame state.
  const configuration = JSON.stringify(options)
  React.useEffect(() => {
    const element = document.createElement('div')
    element.className = `br-magnetic-cursor ${cursorClassName}`.trim()
    element.setAttribute('aria-hidden', 'true')
    document.body.append(element)
    let controller: ReturnType<typeof createMagneticCursor>
    try {
      controller = createMagneticCursor(element, JSON.parse(configuration) as MagneticCursorOptions)
    } catch {
      element.remove()
      document.documentElement.removeAttribute('data-br-cursor')
      return
    }
    return () => { controller.destroy(); element.remove() }
  }, [configuration, cursorClassName])
  return <>{children}</>
}
