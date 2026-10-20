import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface FieldRenderProps {
  id: string
  'aria-invalid': boolean | undefined
  'aria-describedby': string | undefined
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  children: (props: FieldRenderProps) => ReactNode
}

/** Label, hint and error wiring shared by every form control. */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-negative">
          {error}
        </p>
      )}
    </div>
  )
}

export const controlClass = (invalid: boolean) =>
  cn(
    'min-h-11 w-full rounded-md border bg-surface-2 px-3 text-base text-fg',
    'placeholder:text-fg-subtle transition-colors duration-150 ease-out',
    'hover:border-fg-subtle focus-visible:border-accent focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-50',
    invalid ? 'border-negative' : 'border-border-strong',
  )
