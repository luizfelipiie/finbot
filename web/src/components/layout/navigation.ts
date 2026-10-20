import {
  ArrowLeftRight,
  CalendarClock,
  House,
  Settings,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export interface Destination {
  to: string
  label: string
  icon: LucideIcon
}

/** Information architecture from docs/diagnostico.md §5.2 (to be validated in phase 1). */
export const PRIMARY_DESTINATIONS: readonly Destination[] = [
  { to: '/', label: 'Início', icon: House },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/planejar', label: 'Planejar', icon: CalendarClock },
  { to: '/carteira', label: 'Carteira', icon: TrendingUp },
]

export const SETTINGS_DESTINATION: Destination = {
  to: '/configuracoes',
  label: 'Configurações',
  icon: Settings,
}
