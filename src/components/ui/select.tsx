import * as React from 'react'
import { cn } from '@/lib/cn'

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    className={cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
      className,
    )}
    ref={ref}
    {...props}
  />
))
Select.displayName = 'Select'

export { Select }
