import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover',
  secondary: 'bg-surface-2 text-fg border border-border-strong hover:bg-surface-3',
  ghost: 'bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg',
  destructive: 'bg-surface-2 text-negative border border-border-strong hover:bg-surface-3',
}

interface BaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  loading?: boolean
  icon?: ReactNode
}

/** Icon-only buttons take the icon as children and must have an accessible name. */
type ButtonProps =
  | (BaseProps & { children: ReactNode; iconOnly?: false })
  | (BaseProps & { children: ReactNode; iconOnly: true; 'aria-label': string })

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    loading = false,
    icon,
    iconOnly,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md text-sm font-medium',
        'transition-colors duration-150 ease-out select-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        iconOnly ? 'p-0' : 'px-4',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <LoaderCircle aria-hidden size={16} strokeWidth={1.5} className="animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
})
