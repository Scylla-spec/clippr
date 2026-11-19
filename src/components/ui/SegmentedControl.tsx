import { useRef } from 'react'
import { cn } from '@/lib/utils'

export interface SegmentOption {
  value: string
  label: string
}

interface SegmentedControlProps {
  label: string
  options: SegmentOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % options.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index - 1 + options.length) % options.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = options.length - 1
        break
    }

    if (nextIndex !== undefined) {
      event.preventDefault()
      onChange(options[nextIndex].value)
      optionRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex rounded-ui-md border border-border bg-page p-1',
        className,
      )}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            ref={(element) => {
              optionRefs.current[index] = element
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'min-h-touch rounded-ui-sm px-3 text-sm font-medium transition-colors',
              isSelected
                ? 'bg-brand-500 text-on-brand shadow-ui-sm'
                : 'text-text-muted hover:bg-surface hover:text-text',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
