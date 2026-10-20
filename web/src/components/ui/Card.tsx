import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  /** Secondary text under the title, e.g. the period ("Outubro de 2026"). */
  subtitle?: ReactNode
  action?: ReactNode
  /** Heading level for the title, to keep the page outline correct. */
  headingLevel?: 2 | 3
}

export function Card({
  title,
  subtitle,
  action,
  headingLevel = 2,
  className,
  children,
  ...rest
}: CardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <section
      className={cn('rounded-lg border border-border bg-surface-1 p-4 sm:p-5', className)}
      {...rest}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <Heading className="text-base font-semibold text-fg">{title}</Heading>}
            {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
          </div>
          {action && <div className="-my-2 -mr-2 shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
