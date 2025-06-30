import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-200 dark:focus-visible:ring-offset-charcoal-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-terracotta-500 text-white shadow-soft hover:bg-terracotta-600 hover:shadow-medium active:scale-[0.98] dark:shadow-dark-soft dark:hover:shadow-dark-medium',
        destructive:
          'bg-red-600 text-white shadow-soft hover:bg-red-700 hover:shadow-medium active:scale-[0.98]',
        outline:
          'border border-charcoal-200 dark:border-charcoal-700 bg-transparent hover:bg-charcoal-50 dark:hover:bg-charcoal-900 text-charcoal-700 dark:text-charcoal-300',
        secondary:
          'bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200 shadow-soft hover:shadow-medium dark:shadow-dark-soft dark:hover:shadow-dark-medium active:scale-[0.98]',
        ghost:
          'text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-800',
        link: 'text-terracotta-500 dark:text-terracotta-400 underline-offset-4 hover:underline',
        warm: 'bg-cream-300 dark:bg-cream-900 text-charcoal-900 dark:text-cream-100 hover:bg-cream-400 dark:hover:bg-cream-800 active:scale-[0.98]'
      },
      size: {
        default: 'h-10 px-5 py-2 text-sm',
        sm: 'h-8 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
        xs: 'h-7 px-3 text-xs'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
