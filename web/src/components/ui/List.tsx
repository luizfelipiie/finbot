import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function List({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul aria-label={label} className="-mx-1 flex flex-col">
      {children}
    </ul>
  )
}

interface ListItemProps {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  /** Smaller line under the trailing value, e.g. the date. */
  trailingSubtitle?: ReactNode
  onClick?: () => void
}

export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  trailingSubtitle,
  onClick,
}: ListItemProps) {
  const content = (
    <>
      {leading && (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-fg-muted">
          {leading}
        </span>
      )}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium text-fg">{title}</span>
        {subtitle && <span className="block truncate text-xs text-fg-muted">{subtitle}</span>}
      </span>
      {(trailing || trailingSubtitle) && (
        <span className="flex shrink-0 flex-col items-end">
          {trailing && <span className="text-sm">{trailing}</span>}
          {trailingSubtitle && <span className="text-xs text-fg-muted">{trailingSubtitle}</span>}
        </span>
      )}
    </>
  )
  const rowClass = 'flex min-h-14 w-full items-center gap-3 rounded-md px-1 py-2'
  return (
    <li className="border-b border-border last:border-b-0">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={cn(rowClass, 'transition-colors duration-150 ease-out hover:bg-surface-2')}
        >
          {content}
        </button>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  )
}
