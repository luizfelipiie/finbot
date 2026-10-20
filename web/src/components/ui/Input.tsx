import type { InputHTMLAttributes } from 'react'
import { Field, controlClass } from './Field'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className, ...rest }: InputProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(field) => (
        <input
          {...field}
          {...rest}
          className={`${controlClass(Boolean(error))} ${className ?? ''}`}
        />
      )}
    </Field>
  )
}
