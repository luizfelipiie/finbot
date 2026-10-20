import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'accent' | 'positive' | 'negative' | 'warning'

const tones: Record<BadgeTone, string> = {
  neutral: 'text-fg-muted border-border-strong',
  accent: 'text-accent border-accent',
  positive: 'text-positive border-positive',
  negative: 'text-negative border-negative',
  warning: 'text-warning border-warning',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
