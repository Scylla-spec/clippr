/**
 * Badge.tsx — Status / label badge component.
 * Never uses colour alone — always includes text (WCAG 1.4.1).
 */

import { cn } from '@/lib/utils'
import type { Database } from '@/lib/database.types'
import {
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock3,
  Scissors,
  UserRoundX,
  type LucideIcon,
} from 'lucide-react'

type BookingStatus = Database['public']['Enums']['booking_status']

const statusConfig: Record<BookingStatus, { label: string; Icon: LucideIcon; className: string }> = {
  booked: {
    label: 'Booked',
    Icon: CalendarDays,
    className: 'bg-status-booked-bg text-status-booked-text',
  },
  waiting: {
    label: 'Waiting',
    Icon: Clock3,
    className: 'bg-status-waiting-bg text-status-waiting-text',
  },
  in_service: {
    label: 'In service',
    Icon: Scissors,
    className: 'bg-status-in-service-bg text-status-in-service-text',
  },
  done: {
    label: 'Done',
    Icon: CircleCheck,
    className: 'bg-status-done-bg text-status-done-text',
  },
  no_show: {
    label: 'No-show',
    Icon: UserRoundX,
    className: 'bg-status-no-show-bg text-status-no-show-text',
  },
  cancelled: {
    label: 'Cancelled',
    Icon: CircleX,
    className: 'bg-status-cancelled-bg text-status-cancelled-text',
  },
}

interface StatusBadgeProps {
  status: BookingStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, Icon, className: statusClass } = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        statusClass,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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
  default: 'bg-status-neutral-bg text-status-neutral-text',
  success: 'bg-status-success-bg text-status-success-text',
  warning: 'bg-status-warning-bg text-status-warning-text',
  danger: 'bg-status-danger-bg text-status-danger-text',
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
