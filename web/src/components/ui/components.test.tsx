import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { PrivacyProvider, usePrivacy } from '@/app/privacy'
import { cents, type Cents } from '@/lib/money'
import { Amount } from './Amount'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { MoneyInput } from './MoneyInput'
import { ProgressBar } from './ProgressBar'
import { SegmentedControl } from './SegmentedControl'
import { ToastProvider, useToast } from './Toast'

describe('Button', () => {
  it('is disabled and busy while loading', () => {
    render(<Button loading>Salvar</Button>)
    const button = screen.getByRole('button', { name: 'Salvar' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('exposes the accessible name of an icon-only button', () => {
    render(
      <Button iconOnly aria-label="Registrar">
        <svg />
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeInTheDocument()
  })
})

function MoneyHarness({ onValue }: { onValue: (value: Cents | null) => void }) {
  const [value, setValue] = useState<Cents | null>(null)
  return (
    <MoneyInput
      label="Valor"
      value={value}
      onChange={(next) => {
        setValue(next)
        onValue(next)
      }}
    />
  )
}

describe('MoneyInput', () => {
  it('reads pt-BR thousands correctly (bug C-01) and normalizes on blur', async () => {
    const onValue = vi.fn()
    render(<MoneyHarness onValue={onValue} />)
    const input = screen.getByRole('textbox', { name: 'Valor' })
    await userEvent.type(input, '1.234,5')
    expect(onValue).toHaveBeenLastCalledWith(123450)
    await userEvent.tab()
    expect(input).toHaveValue('1.234,50')
  })

  it('reports unreadable input instead of guessing', async () => {
    const onValue = vi.fn()
    render(<MoneyHarness onValue={onValue} />)
    const input = screen.getByRole('textbox', { name: 'Valor' })
    await userEvent.type(input, '12,3,4')
    await userEvent.tab()
    expect(onValue).toHaveBeenLastCalledWith(null)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/Não entendi esse valor/)
  })
})

describe('SegmentedControl', () => {
  it('moves with arrow keys and never ends without a value', async () => {
    function Harness() {
      const [value, setValue] = useState<'a' | 'b'>('a')
      return (
        <SegmentedControl
          label="Período"
          value={value}
          onChange={setValue}
          options={[
            { value: 'a', label: 'Mês' },
            { value: 'b', label: 'Ano' },
          ]}
        />
      )
    }
    render(<Harness />)
    const month = screen.getByRole('radio', { name: 'Mês' })
    await userEvent.click(month)
    expect(month).toBeChecked()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Ano' })).toHaveFocus()
    await userEvent.keyboard(' ')
    expect(screen.getByRole('radio', { name: 'Ano' })).toBeChecked()
  })
})

describe('Dialog', () => {
  it('traps focus, closes with Escape and labels itself', async () => {
    function Harness() {
      const [open, setOpen] = useState(true)
      return (
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Excluir transação?"
          description="Pode ser restaurada."
        >
          <button type="button">Dentro</button>
        </Dialog>
      )
    }
    render(<Harness />)
    const dialog = screen.getByRole('dialog', { name: 'Excluir transação?' })
    expect(dialog).toHaveAccessibleDescription('Pode ser restaurada.')
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Toast', () => {
  it('announces the message', async () => {
    function Trigger() {
      const toast = useToast()
      return (
        <button
          type="button"
          onClick={() => toast.show({ tone: 'success', title: 'Despesa registrada' })}
        >
          Mostrar
        </button>
      )
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
    expect((await screen.findAllByText('Despesa registrada')).length).toBeGreaterThan(0)
  })
})

describe('Amount', () => {
  function Harness() {
    const { toggle } = usePrivacy()
    return (
      <>
        <Amount value={cents(421835)} />
        <Amount value={cents(-5000)} tone="signed" />
        <button type="button" onClick={toggle}>
          Alternar
        </button>
      </>
    )
  }

  it('formats money, signs expenses and hides values in privacy mode', async () => {
    render(
      <PrivacyProvider>
        <Harness />
      </PrivacyProvider>,
    )
    expect(screen.getByText(/R\$\s4\.218,35/)).toBeInTheDocument()
    expect(screen.getByText(/^−\sR\$\s50,00$/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Alternar' }))
    expect(screen.queryByText(/R\$\s\d/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Valor oculto')).toHaveLength(2)
    expect(localStorage.getItem('finbot:privacy-mode')).toBe('on')
  })
})

describe('ProgressBar', () => {
  it('clamps and exposes its value', () => {
    render(<ProgressBar label="Reserva" percent={130} valueText="R$ 13.000 de R$ 10.000" />)
    const bar = screen.getByRole('progressbar', { name: 'Reserva' })
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(bar).toHaveAttribute('aria-valuetext', 'R$ 13.000 de R$ 10.000')
  })
})
