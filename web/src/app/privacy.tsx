import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'finbot:privacy-mode'

interface PrivacyContextValue {
  hidden: boolean
  toggle: () => void
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null)

// Remembered per device. Storage can be unavailable (private mode, blocked site data):
// the app then just starts with values visible.
function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

function writeStored(hidden: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, hidden ? 'on' : 'off')
  } catch {
    // Not persisting is acceptable; the toggle still works for this session.
  }
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(readStored)
  const toggle = useCallback(() => {
    setHidden((current) => {
      writeStored(!current)
      return !current
    })
  }, [])
  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle])
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
}

export function usePrivacy(): PrivacyContextValue {
  const context = useContext(PrivacyContext)
  if (!context) throw new Error('usePrivacy must be used inside PrivacyProvider')
  return context
}
