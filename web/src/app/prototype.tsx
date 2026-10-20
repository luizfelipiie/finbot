import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { DemoScenario } from '@/features/finance/demo'

/**
 * Phase 1 prototype controls: accent option and data scenario. Removed when the app reads real
 * data (phase 3); the chosen accent becomes the only one.
 */
export type Accent = 'ambar' | 'quente' | 'lima'
export type Scenario = DemoScenario | 'loading' | 'error' | 'offline'

export const ACCENTS: readonly { value: Accent; label: string }[] = [
  { value: 'ambar', label: 'Âmbar' },
  { value: 'quente', label: 'Quente' },
  { value: 'lima', label: 'Lima' },
]

export const SCENARIOS: readonly { value: Scenario; label: string }[] = [
  { value: 'normal', label: 'Mês normal' },
  { value: 'overflow', label: 'Estouro' },
  { value: 'no-income', label: 'Sem receita' },
  { value: 'loading', label: 'Carregando' },
  { value: 'error', label: 'Erro' },
  { value: 'offline', label: 'Sem conexão' },
]

const ACCENT_KEY = 'finbot:prototype-accent'

function isAccent(value: string | null): value is Accent {
  return ACCENTS.some((a) => a.value === value)
}

function isScenario(value: string | null): value is Scenario {
  return SCENARIOS.some((s) => s.value === value)
}

/** URL params win (so a link can show a specific variant), then the remembered choice. */
function initialAccent(): Accent {
  const fromUrl = new URLSearchParams(window.location.search).get('accent')
  if (isAccent(fromUrl)) return fromUrl
  try {
    const stored = localStorage.getItem(ACCENT_KEY)
    if (isAccent(stored)) return stored
  } catch {
    // Storage unavailable: fall back to the default accent.
  }
  return 'quente'
}

function initialScenario(): Scenario {
  const fromUrl = new URLSearchParams(window.location.search).get('scenario')
  return isScenario(fromUrl) ? fromUrl : 'normal'
}

interface PrototypeContextValue {
  accent: Accent
  setAccent: (accent: Accent) => void
  scenario: Scenario
  setScenario: (scenario: Scenario) => void
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null)

export function PrototypeProvider({ children }: { children: ReactNode }) {
  // The attribute is applied synchronously so anything reading computed tokens in the same
  // render (the design system page) sees the new accent.
  const [accent, setAccentState] = useState(() => {
    const value = initialAccent()
    document.documentElement.dataset.accent = value
    return value
  })
  const [scenario, setScenario] = useState(initialScenario)

  const setAccent = useCallback((next: Accent) => {
    document.documentElement.dataset.accent = next
    try {
      localStorage.setItem(ACCENT_KEY, next)
    } catch {
      // Not remembering the accent is acceptable.
    }
    setAccentState(next)
  }, [])

  const value = useMemo(
    () => ({ accent, setAccent, scenario, setScenario }),
    [accent, setAccent, scenario],
  )
  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>
}

export function usePrototype(): PrototypeContextValue {
  const context = useContext(PrototypeContext)
  if (!context) throw new Error('usePrototype must be used inside PrototypeProvider')
  return context
}
