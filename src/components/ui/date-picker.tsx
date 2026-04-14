import * as React from 'react'
import { Input } from './input'
import { cn } from '@/lib/cn'

export type DatePickerProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        type="date"
        className={cn(
          'block min-h-[40px] w-full appearance-none', // Ensure consistent height
          'bg-background text-[max(var(--font-size-base),16px)] px-3 py-2',
          // Fix alignment and styling issues for date inputs
          '[&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer',
          '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-clear-button]:appearance-none',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
DatePicker.displayName = 'DatePicker'

export { DatePicker }
