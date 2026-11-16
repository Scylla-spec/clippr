import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

export interface LogoProps {
  size?: number | string
  showWordmark?: boolean
  className?: string
  markClassName?: string
  textClassName?: string
}

export function InfinityMark({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M32 16C38 7 56 7 56 16C56 25 38 25 32 16C26 7 8 7 8 16C8 25 26 25 32 16Z"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({
  size = 32,
  showWordmark = true,
  className,
  markClassName,
  textClassName,
}: LogoProps) {
  const numericSize = typeof size === 'number' ? size : parseInt(size, 10) || 32
  const markWidth = numericSize * 1.5
  const markHeight = numericSize * 0.75

  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <InfinityMark
        width={markWidth}
        height={markHeight}
        className={cn('text-brand-500 shrink-0', markClassName)}
      />
      {showWordmark && (
        <span
          className={cn(
            'font-bold tracking-tight text-surface-900 dark:text-white',
            textClassName,
          )}
          style={{ fontSize: `${numericSize * 0.6}px` }}
        >
          Infinity Barbers
        </span>
      )}
    </div>
  )
}
