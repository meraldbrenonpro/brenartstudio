"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-primary-foreground hover:bg-destructive/90",
        cool: "dark:inset-shadow-2xs dark:inset-shadow-white/10 bg-linear-to-t border border-b-2 border-zinc-950/40 from-primary to-primary/85 shadow-md shadow-primary/20 ring-1 ring-inset ring-white/25 transition-[filter] duration-200 hover:brightness-110 active:brightness-90 dark:border-x-0 text-primary-foreground dark:border-t-0 dark:border-primary/50 dark:ring-white/5",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

const liquidbuttonVariants = cva(
  "liquid-glass-button relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[color,box-shadow,background-color] duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-']):not(.liquid-glass-filter)]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "bg-transparent text-primary",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg:not(.liquid-glass-filter)]:px-3",
        sm: "h-8 gap-1.5 px-4 text-xs",
        lg: "h-10 px-6",
        xl: "h-12 px-8",
        xxl: "h-14 px-10",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "xxl" },
  }
)

export interface LiquidButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof liquidbuttonVariants> {
  asChild?: boolean
  /** Stable suffix for build-time rendering; it must be unique on the page. */
  filterId?: string
  /** Opt in only after checking SVG backdrop-filter support in the target browser. */
  refraction?: boolean
}

export function GlassFilter({ id }: { id: string }) {
  return (
    <svg
      className="liquid-glass-filter"
      xmlns="http://www.w3.org/2000/svg"
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id={id}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      filterId,
      refraction = false,
      style,
      ...props
    },
    ref
  ) => {
    const instanceId = React.useId()
    const safeId = (filterId || instanceId).replace(/[^a-zA-Z0-9_-]/g, "")
    const resolvedFilterId = `liquid-glass-${safeId || instanceId.replace(/[^a-zA-Z0-9_-]/g, "")}`
    const glassStyle = {
      ...style,
      "--liquid-filter": `url("#${resolvedFilterId}")`,
    } as React.CSSProperties

    const contents = (content: React.ReactNode) => (
      <>
        <span className="liquid-glass-backdrop" aria-hidden="true" />
        <span className="liquid-glass-rim" aria-hidden="true" />
        <span className="liquid-glass-content">{content}</span>
        <GlassFilter id={resolvedFilterId} />
      </>
    )

    const rootProps = {
      ...props,
      "data-slot": "button",
      "data-glass-refraction": refraction ? "" : undefined,
      className: cn(liquidbuttonVariants({ variant, size, className })),
      style: glassStyle,
    }

    if (asChild) {
      const child = React.Children.only(children)
      if (!React.isValidElement<{ children?: React.ReactNode }>(child)) {
        throw new Error("LiquidButton with asChild requires one React element.")
      }
      return (
        <Slot ref={ref} {...rootProps}>
          {React.cloneElement(child, undefined, contents(child.props.children))}
        </Slot>
      )
    }

    return (
      <button ref={ref} {...rootProps}>
        {contents(children)}
      </button>
    )
  }
)
LiquidButton.displayName = "LiquidButton"

export type ColorVariant = "default" | "primary" | "success" | "error" | "gold" | "bronze"

export interface MetalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ColorVariant
}

const colorVariants: Record<
  ColorVariant,
  { outer: string; inner: string; button: string; textColor: string; textShadow: string }
> = {
  default: {
    outer: "bg-gradient-to-b from-[#000] to-[#A0A0A0]",
    inner: "bg-gradient-to-b from-[#FAFAFA] via-[#3E3E3E] to-[#E5E5E5]",
    button: "bg-gradient-to-b from-[#B9B9B9] to-[#969696]",
    textColor: "text-white",
    textShadow: "[text-shadow:_0_-1px_0_rgb(80_80_80_/_100%)]",
  },
  primary: {
    outer: "bg-gradient-to-b from-[#000] to-[#A0A0A0]",
    inner: "bg-gradient-to-b from-primary via-secondary to-muted",
    button: "bg-gradient-to-b from-primary to-primary/40",
    textColor: "text-white",
    textShadow: "[text-shadow:_0_-1px_0_rgb(30_58_138_/_100%)]",
  },
  success: {
    outer: "bg-gradient-to-b from-[#005A43] to-[#7CCB9B]",
    inner: "bg-gradient-to-b from-[#E5F8F0] via-[#00352F] to-[#D1F0E6]",
    button: "bg-gradient-to-b from-[#9ADBC8] to-[#3E8F7C]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(6_78_59_/_100%)]",
  },
  error: {
    outer: "bg-gradient-to-b from-[#5A0000] to-[#FFAEB0]",
    inner: "bg-gradient-to-b from-[#FFDEDE] via-[#680002] to-[#FFE9E9]",
    button: "bg-gradient-to-b from-[#F08D8F] to-[#A45253]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(146_64_14_/_100%)]",
  },
  gold: {
    outer: "bg-gradient-to-b from-[#917100] to-[#EAD98F]",
    inner: "bg-gradient-to-b from-[#FFFDDD] via-[#856807] to-[#FFF1B3]",
    button: "bg-gradient-to-b from-[#FFEBA1] to-[#9B873F]",
    textColor: "text-[#FFFDE5]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(178_140_2_/_100%)]",
  },
  bronze: {
    outer: "bg-gradient-to-b from-[#864813] to-[#E9B486]",
    inner: "bg-gradient-to-b from-[#EDC5A1] via-[#5F2D01] to-[#FFDEC1]",
    button: "bg-gradient-to-b from-[#FFE3C9] to-[#A36F3D]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(124_45_18_/_100%)]",
  },
}

function metalButtonVariants(
  variant: ColorVariant,
  isPressed: boolean,
  isHovered: boolean,
  isTouchDevice: boolean
) {
  const colors = colorVariants[variant]
  const transition = "all 250ms cubic-bezier(0.1, 0.4, 0.2, 1)"
  return {
    wrapper: cn(
      "metal-button relative inline-flex transform-gpu rounded-md p-[1.25px] motion-reduce:transition-none has-[button:disabled]:opacity-50",
      colors.outer
    ),
    wrapperStyle: {
      transform: isPressed ? "translateY(2.5px) scale(0.99)" : "translateY(0) scale(1)",
      boxShadow: isPressed
        ? "0 1px 2px rgba(0, 0, 0, 0.15)"
        : isHovered && !isTouchDevice
          ? "0 4px 12px rgba(0, 0, 0, 0.12)"
          : "0 3px 8px rgba(0, 0, 0, 0.08)",
      transition,
      transformOrigin: "center center",
    },
    inner: cn("absolute inset-[1px] transform-gpu rounded-lg", colors.inner),
    innerStyle: {
      transition,
      transformOrigin: "center center",
      filter: isHovered && !isPressed && !isTouchDevice ? "brightness(1.05)" : "none",
    },
    button: cn(
      "metal-button-control relative z-10 m-[1px] inline-flex h-11 transform-gpu cursor-pointer items-center justify-center overflow-hidden rounded-md px-6 py-2 text-sm font-semibold leading-none outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed motion-reduce:transition-none",
      colors.button,
      colors.textColor,
      colors.textShadow
    ),
    buttonStyle: {
      transform: isPressed ? "scale(0.97)" : "scale(1)",
      transition,
      transformOrigin: "center center",
      filter: isHovered && !isPressed && !isTouchDevice ? "brightness(1.02)" : "none",
    },
  }
}

function ShineEffect({ isPressed }: { isPressed: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-300 motion-reduce:transition-none",
        isPressed ? "opacity-20" : "opacity-0"
      )}
    >
      <span className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-neutral-100 to-transparent" />
    </span>
  )
}

const MetalButton = React.forwardRef<HTMLButtonElement, MetalButtonProps>(
  (
    {
      children,
      className,
      variant = "default",
      disabled,
      style,
      onPointerDown,
      onPointerUp,
      onPointerEnter,
      onPointerLeave,
      onPointerCancel,
      onLostPointerCapture,
      onKeyDown,
      onKeyUp,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [pointerPressed, setPointerPressed] = React.useState(false)
    const [keyboardPressed, setKeyboardPressed] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isTouchDevice, setIsTouchDevice] = React.useState(false)
    const activePointer = React.useRef<number | null>(null)
    const isPressed = !disabled && (pointerPressed || keyboardPressed)
    const variants = metalButtonVariants(variant, isPressed, !disabled && isHovered, isTouchDevice)

    const releasePointer = React.useCallback(() => {
      activePointer.current = null
      setPointerPressed(false)
    }, [])

    React.useEffect(() => {
      if (!pointerPressed && !keyboardPressed) return
      const release = (event: PointerEvent) => {
        if (event.pointerId === activePointer.current) releasePointer()
      }
      const cancel = () => {
        releasePointer()
        setKeyboardPressed(false)
        setIsHovered(false)
      }
      window.addEventListener("pointerup", release)
      window.addEventListener("pointercancel", release)
      window.addEventListener("blur", cancel)
      return () => {
        window.removeEventListener("pointerup", release)
        window.removeEventListener("pointercancel", release)
        window.removeEventListener("blur", cancel)
      }
    }, [pointerPressed, keyboardPressed, releasePointer])

    React.useEffect(() => {
      if (!disabled) return
      releasePointer()
      setKeyboardPressed(false)
      setIsHovered(false)
    }, [disabled, releasePointer])

    return (
      <span
        className={variants.wrapper}
        style={variants.wrapperStyle}
        data-disabled={disabled ? "" : undefined}
      >
        <span aria-hidden="true" className={variants.inner} style={variants.innerStyle} />
        <button
          {...props}
          ref={ref}
          disabled={disabled}
          className={cn(variants.button, className)}
          style={{ ...variants.buttonStyle, ...style }}
          onPointerDown={(event) => {
            onPointerDown?.(event)
            if (event.defaultPrevented || disabled || event.button !== 0) return
            activePointer.current = event.pointerId
            setIsTouchDevice(event.pointerType === "touch")
            setPointerPressed(true)
          }}
          onPointerUp={(event) => {
            onPointerUp?.(event)
            releasePointer()
          }}
          onPointerEnter={(event) => {
            onPointerEnter?.(event)
            if (event.defaultPrevented || disabled) return
            const touch = event.pointerType === "touch"
            setIsTouchDevice(touch)
            setIsHovered(!touch)
          }}
          onPointerLeave={(event) => {
            onPointerLeave?.(event)
            releasePointer()
            setIsHovered(false)
          }}
          onPointerCancel={(event) => {
            onPointerCancel?.(event)
            releasePointer()
            setIsHovered(false)
          }}
          onLostPointerCapture={(event) => {
            onLostPointerCapture?.(event)
            releasePointer()
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (
              !event.defaultPrevented &&
              !disabled &&
              !event.repeat &&
              event.target === event.currentTarget &&
              (event.key === "Enter" || event.key === " ")
            ) {
              setKeyboardPressed(true)
            }
          }}
          onKeyUp={(event) => {
            onKeyUp?.(event)
            if (event.key === "Enter" || event.key === " ") setKeyboardPressed(false)
          }}
          onBlur={(event) => {
            onBlur?.(event)
            releasePointer()
            setKeyboardPressed(false)
            setIsHovered(false)
          }}
        >
          <ShineEffect isPressed={isPressed} />
          {children ?? "Button"}
          {isHovered && !isPressed && !isTouchDevice && !disabled && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-transparent to-white/5"
            />
          )}
        </button>
      </span>
    )
  }
)
MetalButton.displayName = "MetalButton"

export { Button, buttonVariants, LiquidButton, liquidbuttonVariants, MetalButton }
