import { Dialog as RadixDialog } from 'radix-ui'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

interface OverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  /** Buttons at the bottom; the primary action goes last. */
  footer?: ReactNode
}

function Content({
  title,
  description,
  children,
  footer,
  className,
}: Omit<OverlayProps, 'open' | 'onOpenChange'> & { className: string }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-scrim animate-fade-in" />
      <RadixDialog.Content
        className={cn(
          'fixed z-(--z-overlay) flex flex-col border border-border bg-surface-2',
          className,
        )}
        // Without a description Radix warns; pass undefined explicitly to opt out.
        {...(description ? {} : { 'aria-describedby': undefined })}
      >
        <header className="flex items-start justify-between gap-3 p-4 pb-2 sm:p-5 sm:pb-2">
          <div>
            <RadixDialog.Title className="text-lg font-semibold text-fg">{title}</RadixDialog.Title>
            {description && (
              <RadixDialog.Description className="mt-1 text-sm text-fg-muted">
                {description}
              </RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close asChild>
            <Button variant="ghost" iconOnly aria-label="Fechar" className="-mr-2 -mt-1">
              <X aria-hidden size={20} strokeWidth={1.5} />
            </Button>
          </RadixDialog.Close>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 sm:px-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 p-4 sm:p-5">{footer}</footer>}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

/** Centered dialog for desktop and for confirmations. */
export function Dialog({ open, onOpenChange, ...content }: OverlayProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <Content
        {...content}
        className="left-1/2 top-1/2 max-h-[85dvh] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg animate-fade-in"
      />
    </RadixDialog.Root>
  )
}

/** Sheet anchored to the bottom edge, for mobile flows such as quick entry. */
export function BottomSheet({ open, onOpenChange, ...content }: OverlayProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <Content
        {...content}
        className="inset-x-0 bottom-0 max-h-[90dvh] rounded-t-lg border-b-0 pb-[env(safe-area-inset-bottom)] animate-sheet-in sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2"
      />
    </RadixDialog.Root>
  )
}
