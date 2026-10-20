import { FlaskConical } from 'lucide-react'
import { ACCENTS, SCENARIOS, usePrototype } from '@/app/prototype'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

/** Visible on every screen of the prototype, so fictional data is never mistaken for real. */
export function PrototypeBar({ showScenarios }: { showScenarios: boolean }) {
  const { accent, setAccent, scenario, setScenario } = usePrototype()
  return (
    <div className="border-b border-border bg-surface-1">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-2 lg:flex-row lg:items-center lg:gap-4 lg:px-8">
        <p className="flex shrink-0 items-center gap-2 text-sm text-fg-muted">
          <FlaskConical aria-hidden size={16} strokeWidth={1.5} className="shrink-0" />
          Protótipo com dados fictícios
        </p>
        {/* Scrolls inside itself on narrow screens instead of widening the page. */}
        <div className="-mx-4 min-w-0 overflow-x-auto px-4 lg:mx-0 lg:ml-auto lg:px-0">
          <div className="flex w-max items-center gap-3 lg:w-auto lg:flex-wrap lg:justify-end">
            <SegmentedControl
              label="Cor de destaque"
              options={ACCENTS}
              value={accent}
              onChange={setAccent}
            />
            {showScenarios && (
              <SegmentedControl
                label="Cenário"
                options={SCENARIOS}
                value={scenario}
                onChange={setScenario}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
