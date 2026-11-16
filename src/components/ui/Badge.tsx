/**
 * Badge.tsx — Status / label badge component.
 * Never uses colour alone — always includes text (WCAG 1.4.1).
 */

import { cn } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type BookingStatus = Database['public']['Enums']['booking_status']

const statusConfig: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  booked:     { label: 'Booked',      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  waiting:    { label: 'Waiting',     className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
  in_service: { label: 'In service',  className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  done:       { label: 'Done',        className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  no_show:    { label: 'No-show',     className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
  cancelled:  { label: 'Cancelled',   className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
}

interface StatusBadgeProps {
  status: BookingStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: statusClass } = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusClass,
        className,
      )}
    >
      {label}
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

const badgeVariants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  danger:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
