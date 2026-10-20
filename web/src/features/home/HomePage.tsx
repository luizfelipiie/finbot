import { Eye, EyeOff } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { usePrivacy } from '@/app/privacy'
import { usePrototype } from '@/app/prototype'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, LoadingRegion, Skeleton } from '@/components/ui/States'
import {
  balanceSummary,
  cycleComparison,
  incomeAllocation,
  pendingReviewCount,
  recentTransactions,
  upcomingCharges,
} from '@/features/finance/derive'
import { demoSnapshot } from '@/features/finance/demo'
import { greetingFor, hourIn, todayIn } from '@/lib/dates'
import { BalanceCard } from './BalanceCard'
import { CycleSummary } from './CycleSummary'
import { IncomeCard } from './IncomeCard'
import {
  PendingReview,
  PortfolioCard,
  RecentTransactions,
  SavingsBoxes,
  UpcomingCharges,
} from './Sections'

function Greeting({ firstName }: { firstName: string }) {
  const { hidden, toggle } = usePrivacy()
  const Icon = hidden ? EyeOff : Eye
  return (
    <header className="mb-4 flex items-center justify-between gap-3 lg:mb-6">
      <h1 className="text-xl font-semibold tracking-tight text-fg lg:text-2xl">
        {greetingFor(hourIn())}, {firstName}
      </h1>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          iconOnly
          aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
          aria-pressed={hidden}
          onClick={toggle}
        >
          <Icon aria-hidden size={20} strokeWidth={1.5} />
        </Button>
        <Link
          to="/configuracoes"
          aria-label="Configurações"
          className="flex size-11 items-center justify-center lg:hidden"
        >
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-full border border-border-strong bg-surface-2 text-sm font-medium text-fg"
          >
            {firstName.charAt(0)}
          </span>
        </Link>
      </div>
    </header>
  )
}

function HomeSkeleton() {
  return (
    <LoadingRegion label="Carregando o painel">
      <Skeleton className="mb-6 h-8 w-56" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Skeleton className="h-44 lg:col-span-7" />
        <Skeleton className="h-44 lg:col-span-5" />
        <Skeleton className="h-72 lg:col-span-7" />
        <Skeleton className="h-72 lg:col-span-5" />
      </div>
    </LoadingRegion>
  )
}

export function HomePage() {
  const { scenario, setScenario } = usePrototype()
  const today = todayIn()
  const data = useMemo(() => {
    const snapshot = demoSnapshot(
      today,
      scenario === 'overflow' || scenario === 'no-income' ? scenario : 'normal',
    )
    return {
      snapshot,
      summary: balanceSummary(snapshot),
      cycle: cycleComparison(snapshot, today),
      allocation: incomeAllocation(snapshot, today),
      charges: upcomingCharges(snapshot, today),
      pending: pendingReviewCount(snapshot.transactions, today),
      recent: recentTransactions(snapshot.transactions),
    }
  }, [today, scenario])

  if (scenario === 'loading') return <HomeSkeleton />

  if (scenario === 'error') {
    return (
      <Card>
        <ErrorState
          title="Não foi possível carregar o painel."
          description="O servidor não respondeu. Seus dados não foram alterados."
          onRetry={() => setScenario('normal')}
        />
      </Card>
    )
  }

  const { snapshot, summary, cycle, allocation, charges, pending, recent } = data

  return (
    <>
      <Greeting firstName={snapshot.userFirstName} />
      {/* DOM order is the mobile order (briefing §7.2); on desktop, cards in a row share its height. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-7 *:h-full">
          <BalanceCard summary={summary} />
        </div>
        <div className="lg:col-span-5 *:h-full">
          <CycleSummary cycle={cycle} />
        </div>
        <div className="lg:col-span-7 *:h-full">
          <IncomeCard allocation={allocation} snapshot={snapshot} today={today} />
        </div>
        <div className="lg:col-span-5 *:h-full">
          <UpcomingCharges charges={charges} />
        </div>
        <div className="empty:hidden lg:col-span-12">
          <PendingReview count={pending} today={today} />
        </div>
        <div className={snapshot.portfolio ? 'lg:col-span-6 *:h-full' : 'lg:col-span-12'}>
          <SavingsBoxes snapshot={snapshot} summary={summary} />
        </div>
        {snapshot.portfolio && (
          <div className="lg:col-span-6 *:h-full">
            <PortfolioCard portfolio={snapshot.portfolio} />
          </div>
        )}
        <div className="lg:col-span-12">
          <RecentTransactions transactions={recent} today={today} />
        </div>
      </div>
    </>
  )
}
