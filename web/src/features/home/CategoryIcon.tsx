import {
  ArrowLeftRight,
  Banknote,
  Car,
  CircleEllipsis,
  Clapperboard,
  CreditCard,
  HeartPulse,
  House,
  PiggyBank,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  Salário: Banknote,
  Moradia: House,
  Mercado: ShoppingCart,
  Alimentação: Utensils,
  Transporte: Car,
  Saúde: HeartPulse,
  Lazer: Clapperboard,
  Compras: ShoppingBag,
  Assinaturas: Repeat,
  Caixinhas: PiggyBank,
  'Fatura do cartão': CreditCard,
  Transferência: ArrowLeftRight,
}

export function CategoryIcon({ category, size = 20 }: { category: string; size?: number }) {
  const Icon = ICONS[category] ?? CircleEllipsis
  return <Icon aria-hidden size={size} strokeWidth={1.5} />
}
