import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, MessageSquareText } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { BottomSheet } from '@/components/ui/Dialog'

const OPTIONS = [
  { label: 'Despesa', description: 'Algo que você pagou', icon: ArrowUpRight },
  { label: 'Receita', description: 'Dinheiro que entrou', icon: ArrowDownLeft },
  {
    label: 'Transferência',
    description: 'Entre contas, caixinhas ou fatura',
    icon: ArrowLeftRight,
  },
  {
    label: 'Registrar por texto',
    description: 'Escreva como falaria, ex.: "gastei 50 no mercado"',
    icon: MessageSquareText,
  },
] as const

/** Entry point of the "+" button. Recording itself arrives in phase 3; the sheet says so. */
export function QuickEntrySheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar"
      description="No protótipo, os registros ainda não são salvos."
    >
      <ul className="flex flex-col pb-2">
        {OPTIONS.map(({ label, description, icon: Icon }) => (
          <li key={label} className="border-b border-border last:border-b-0">
            <button
              type="button"
              disabled
              className="flex min-h-14 w-full items-center gap-3 py-2 text-left disabled:cursor-not-allowed"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-3 text-fg-muted">
                <Icon aria-hidden size={20} strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-fg">{label}</span>
                <span className="block text-xs text-fg-muted">{description}</span>
              </span>
              <Badge>Em breve</Badge>
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  )
}
