import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  // Pure tests run in the node environment, where localStorage does not exist.
  if (typeof localStorage !== 'undefined') localStorage.clear()
})
