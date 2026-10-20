import { CloudOff, RotateCw, TriangleAlert } from 'lucide-react'
import { useSyncExternalStore, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-start gap-3 py-2', className)}>
      {icon && <div className="text-fg-subtle">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-fg">{title}</p>
        {description && <p className="mt-1 max-w-prose text-sm text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string
  description: string
  onRetry?: () => void
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 py-2">
      <TriangleAlert aria-hidden size={20} strokeWidth={1.5} className="text-negative" />
      <div>
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">{description}</p>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          onClick={onRetry}
          icon={<RotateCw aria-hidden size={16} strokeWidth={1.5} />}
        >
          Tentar de novo
        </Button>
      )}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-surface-3', className)} />
}

/** Wraps skeletons so assistive tech announces loading once instead of reading empty boxes. */
export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  )
}

export function OfflineBanner({ forceOffline = false }: { forceOffline?: boolean }) {
  const online = useOnline()
  if (online && !forceOffline) return null
  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-2 text-sm text-fg"
    >
      <CloudOff aria-hidden size={16} strokeWidth={1.5} className="shrink-0 text-warning" />
      Sem conexão. Os valores mostrados podem estar desatualizados.
    </div>
  )
}
