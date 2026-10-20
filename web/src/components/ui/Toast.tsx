import { Toast as RadixToast } from 'radix-ui'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ToastTone = 'success' | 'error'

interface ToastMessage {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

interface ToastContextValue {
  show: (toast: Omit<ToastMessage, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const show = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    setToasts((current) => [...current, { ...toast, id: nextId++ }])
  }, [])
  const remove = (id: number) => setToasts((current) => current.filter((t) => t.id !== id))
  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider swipeDirection="down" label="Notificação">
        {children}
        {toasts.map((toast) => {
          const Icon = toast.tone === 'success' ? CircleCheck : CircleAlert
          return (
            <RadixToast.Root
              key={toast.id}
              // Errors stay until dismissed: they usually need an action.
              duration={toast.tone === 'error' ? Infinity : 5000}
              type={toast.tone === 'error' ? 'foreground' : 'background'}
              onOpenChange={(open) => !open && remove(toast.id)}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface-3 p-3 pr-2 animate-fade-in"
            >
              <Icon
                aria-hidden
                size={20}
                strokeWidth={1.5}
                className={cn(
                  'mt-0.5 shrink-0',
                  toast.tone === 'success' ? 'text-positive' : 'text-negative',
                )}
              />
              <div className="min-w-0 flex-1">
                <RadixToast.Title className="text-sm font-medium text-fg">
                  {toast.title}
                </RadixToast.Title>
                {toast.description && (
                  <RadixToast.Description className="mt-0.5 text-sm text-fg-muted">
                    {toast.description}
                  </RadixToast.Description>
                )}
              </div>
              <RadixToast.Close
                aria-label="Fechar notificação"
                className="-my-1 flex size-9 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
              >
                <X aria-hidden size={16} strokeWidth={1.5} />
              </RadixToast.Close>
            </RadixToast.Root>
          )
        })}
        <RadixToast.Viewport className="fixed inset-x-4 bottom-[calc(88px+env(safe-area-inset-bottom))] z-(--z-toast) flex flex-col gap-2 outline-none md:inset-x-auto md:right-6 md:bottom-6 md:w-96" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
