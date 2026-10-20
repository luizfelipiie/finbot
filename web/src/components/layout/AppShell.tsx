import { Plus } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { usePrototype } from '@/app/prototype'
import { Button } from '@/components/ui/Button'
import { OfflineBanner } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { PRIMARY_DESTINATIONS, SETTINGS_DESTINATION, type Destination } from './navigation'
import { PrototypeBar } from './PrototypeBar'
import { QuickEntrySheet } from './QuickEntrySheet'

function Wordmark() {
  return (
    <span className="flex items-center gap-2 text-base font-semibold tracking-tight text-fg">
      <span
        aria-hidden
        className="flex size-7 items-center justify-center rounded-md bg-accent text-sm text-accent-ink"
      >
        F
      </span>
      FinBot
    </span>
  )
}

function SidebarLink({ destination }: { destination: Destination }) {
  const Icon = destination.icon
  return (
    <NavLink
      to={destination.to}
      end={destination.to === '/'}
      className={({ isActive }) =>
        cn(
          'relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150 ease-out',
          isActive ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-sm bg-accent" />
          )}
          <Icon
            aria-hidden
            size={20}
            strokeWidth={1.5}
            className={isActive ? 'text-accent' : undefined}
          />
          {destination.label}
        </>
      )}
    </NavLink>
  )
}

function BottomNavLink({ destination }: { destination: Destination }) {
  const Icon = destination.icon
  return (
    <NavLink
      to={destination.to}
      end={destination.to === '/'}
      className={({ isActive }) =>
        cn(
          'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium',
          isActive ? 'text-fg' : 'text-fg-muted',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            aria-hidden
            size={24}
            strokeWidth={1.5}
            className={isActive ? 'text-accent' : undefined}
          />
          {destination.label}
        </>
      )}
    </NavLink>
  )
}

export function AppShell() {
  const [entryOpen, setEntryOpen] = useState(false)
  const { scenario } = usePrototype()
  const { pathname } = useLocation()
  const [first, second, ...rest] = PRIMARY_DESTINATIONS

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <a
        href="#conteudo"
        className="sr-only z-(--z-toast) rounded-md bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-bg p-4 lg:flex">
        <div className="px-3 py-2">
          <Wordmark />
        </div>
        <Button
          className="mt-6 justify-start"
          icon={<Plus aria-hidden size={20} strokeWidth={1.5} />}
          onClick={() => setEntryOpen(true)}
        >
          Registrar
        </Button>
        <nav
          aria-label="Principal"
          className="mt-6 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
        >
          {PRIMARY_DESTINATIONS.map((d) => (
            <SidebarLink key={d.to} destination={d} />
          ))}
        </nav>
        <div className="border-t border-border pt-3">
          <SidebarLink destination={SETTINGS_DESTINATION} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <PrototypeBar showScenarios={pathname === '/'} />
        <OfflineBanner forceOffline={scenario === 'offline'} />
        <main
          id="conteudo"
          className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-4 pb-28 lg:px-8 lg:pt-8 lg:pb-12"
        >
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-(--z-nav) border-t border-border bg-surface-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="mx-auto flex max-w-lg items-stretch px-2">
          {first && <BottomNavLink destination={first} />}
          {second && <BottomNavLink destination={second} />}
          <div className="flex flex-1 items-center justify-center">
            <Button
              iconOnly
              aria-label="Registrar"
              className="size-12 rounded-md"
              onClick={() => setEntryOpen(true)}
            >
              <Plus aria-hidden size={24} strokeWidth={1.5} />
            </Button>
          </div>
          {rest.map((d) => (
            <BottomNavLink key={d.to} destination={d} />
          ))}
        </div>
      </nav>

      <QuickEntrySheet open={entryOpen} onOpenChange={setEntryOpen} />
    </div>
  )
}
