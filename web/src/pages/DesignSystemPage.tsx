import { Inbox, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { usePrivacy } from '@/app/privacy'
import { usePrototype } from '@/app/prototype'
import { Amount } from '@/components/ui/Amount'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BottomSheet, Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { List, ListItem } from '@/components/ui/List'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import {
  EmptyState,
  ErrorState,
  LoadingRegion,
  OfflineBanner,
  Skeleton,
} from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { Tooltip } from '@/components/ui/Tooltip'
import { contrastRatio } from '@/lib/contrast'
import { cents, formatMoney, type Cents } from '@/lib/money'

const SURFACES = ['bg', 'surface-1', 'surface-2', 'surface-3'] as const
const COLOR_GROUPS: { title: string; tokens: string[] }[] = [
  { title: 'Superfícies', tokens: [...SURFACES] },
  { title: 'Bordas', tokens: ['border', 'border-strong'] },
  { title: 'Texto', tokens: ['fg', 'fg-muted', 'fg-subtle'] },
  {
    title: 'Destaque e significado',
    tokens: ['accent', 'accent-hover', 'positive', 'negative', 'warning'],
  },
  { title: 'Gráficos', tokens: ['chart-1', 'chart-2', 'chart-3'] },
]
const TEXT_TOKENS = ['fg', 'fg-muted', 'fg-subtle', 'accent', 'positive', 'negative', 'warning']

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim()
}

function useTokenValues(): Record<string, string> {
  const { accent } = usePrototype()
  return useMemo(() => {
    const names = [...new Set(COLOR_GROUPS.flatMap((g) => g.tokens).concat('accent-ink'))]
    // `accent` is a dependency because the accent attribute changes the computed values.
    void accent
    return Object.fromEntries(names.map((n) => [n, readToken(n)]))
  }, [accent])
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
      <div>
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        {description && <p className="mt-1 max-w-prose text-sm text-fg-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-fg-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

function Colors({ values }: { values: Record<string, string> }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {COLOR_GROUPS.map((group) => (
        <div key={group.title}>
          <h3 className="mb-2 text-sm font-medium text-fg">{group.title}</h3>
          <ul className="flex flex-col gap-2">
            {group.tokens.map((token) => (
              <li key={token} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="size-8 shrink-0 rounded-md border border-border"
                  style={{ background: `var(--c-${token})` }}
                />
                <code className="text-sm text-fg">--c-{token}</code>
                <span className="ml-auto text-xs text-fg-muted tabular">{values[token]}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function ContrastTable({ values }: { values: Record<string, string> }) {
  const ready = SURFACES.every((s) => values[s]?.startsWith('#'))
  if (!ready) return null
  const ink = values['accent-ink'] ?? ''
  const accent = values.accent ?? ''
  return (
    // Focusable so keyboard users can scroll the table on narrow screens.
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela de contraste">
      <table className="w-full min-w-[480px] text-left text-sm">
        <caption className="mb-2 text-left text-xs text-fg-muted">
          Razão de contraste WCAG. Texto exige 4,5:1 (AA). Valores reprovados aparecem marcados.
        </caption>
        <thead>
          <tr className="border-b border-border text-xs text-fg-muted">
            <th scope="col" className="py-2 font-medium">
              Texto
            </th>
            {SURFACES.map((s) => (
              <th key={s} scope="col" className="py-2 font-medium">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TEXT_TOKENS.map((token) => (
            <tr key={token} className="border-b border-border">
              <th scope="row" className="py-2 font-normal" style={{ color: `var(--c-${token})` }}>
                {token}
              </th>
              {SURFACES.map((s) => {
                const ratio = contrastRatio(values[token] ?? '', values[s] ?? '')
                return (
                  <td key={s} className="py-2 tabular">
                    {ratio.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}:1{' '}
                    {ratio < 4.5 && <Badge tone="negative">Reprovado</Badge>}
                  </td>
                )
              })}
            </tr>
          ))}
          <tr>
            <th scope="row" className="py-2 font-normal">
              accent-ink sobre accent
            </th>
            <td colSpan={4} className="py-2 tabular">
              {contrastRatio(ink, accent).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}:1
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const TYPE_SCALE = [
  { className: 'text-3xl font-semibold', label: '40/48 semibold', sample: 'R$ 6.703' },
  { className: 'text-2xl font-semibold', label: '32/40 semibold', sample: 'Boa noite, Ana' },
  {
    className: 'text-xl font-semibold',
    label: '24/32 semibold',
    sample: 'Para onde foi sua renda',
  },
  { className: 'text-lg font-semibold', label: '20/28 semibold', sample: 'Saldo por conta' },
  { className: 'text-base font-medium', label: '16/24 medium', sample: 'Compromissos fixos' },
  {
    className: 'text-base',
    label: '16/24 regular',
    sample: 'Texto corrido e campos de formulário.',
  },
  { className: 'text-sm', label: '14/20 regular', sample: 'Legendas, linhas de lista e botões.' },
  {
    className: 'text-xs',
    label: '12/16 regular',
    sample: 'Datas, rótulos auxiliares e porcentagens.',
  },
]

function Overlays() {
  const [dialog, setDialog] = useState(false)
  const [sheet, setSheet] = useState(false)
  const toast = useToast()
  return (
    <>
      <Specimen label="Dialog, BottomSheet e Toast">
        <Button variant="secondary" onClick={() => setDialog(true)}>
          Abrir diálogo
        </Button>
        <Button variant="secondary" onClick={() => setSheet(true)}>
          Abrir painel inferior
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.show({
              tone: 'success',
              title: 'Despesa registrada',
              description: 'Mercado, R$ 50,00.',
            })
          }
        >
          Toast de sucesso
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.show({
              tone: 'error',
              title: 'Não foi possível salvar',
              description: 'Verifique sua conexão e tente de novo. Nada foi alterado.',
            })
          }
        >
          Toast de erro
        </Button>
      </Specimen>
      <Dialog
        open={dialog}
        onOpenChange={setDialog}
        title="Excluir transação?"
        description="A transação vai para a lixeira e pode ser restaurada por 30 dias."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              icon={<Trash2 aria-hidden size={16} strokeWidth={1.5} />}
              onClick={() => setDialog(false)}
            >
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">Supermercado, 12 out, {formatMoney(cents(24180))}.</p>
      </Dialog>
      <BottomSheet
        open={sheet}
        onOpenChange={setSheet}
        title="Painel inferior"
        description="Usado no mobile para fluxos curtos."
      >
        <p className="pb-4 text-sm text-fg-muted">
          Fecha com Esc, tocando fora ou pelo botão de fechar.
        </p>
      </BottomSheet>
    </>
  )
}

export function DesignSystemPage() {
  const values = useTokenValues()
  const { hidden, toggle } = usePrivacy()
  const [money, setMoney] = useState<Cents | null>(cents(123456))
  const [period, setPeriod] = useState<'mes' | 'trimestre' | 'ano'>('mes')

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Design system</h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">
          Tokens e componentes base do FinBot. Troque a cor de destaque na barra acima; a tabela de
          contraste é recalculada.
        </p>
      </header>

      <Section
        title="Cores"
        description="Os únicos valores de cor do app. Componentes usam apenas estes tokens."
      >
        <Colors values={values} />
        <ContrastTable values={values} />
      </Section>

      <Section
        title="Tipografia"
        description="Geist, pesos 400, 500 e 600. Valores sempre com algarismos tabulares."
      >
        <ul className="flex flex-col gap-3">
          {TYPE_SCALE.map((row) => (
            <li
              key={row.label}
              className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6"
            >
              <span className="w-32 shrink-0 text-xs text-fg-muted">{row.label}</span>
              <span className={`${row.className} text-fg`}>{row.sample}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Raio e espaçamento"
        description="Raio 4 (badge), 8 (botão, campo) e 12 (card). Grade de 4px."
      >
        <div className="flex flex-wrap items-end gap-4">
          {[
            ['rounded-sm', '4px'],
            ['rounded-md', '8px'],
            ['rounded-lg', '12px'],
            ['rounded-full', 'avatar'],
          ].map(([cls, label]) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <span className={`size-14 border border-border-strong bg-surface-2 ${cls}`} />
              <span className="text-xs text-fg-muted">{label}</span>
            </div>
          ))}
          <div className="flex items-end gap-1">
            {[1, 2, 3, 4, 6, 8].map((n) => (
              <span
                key={n}
                className="w-3 bg-chart-3"
                style={{ height: n * 4 }}
                title={`${n * 4}px`}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Botões">
        <Specimen label="Variantes">
          <Button>Registrar despesa</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="ghost">Ver todas</Button>
          <Button variant="destructive">Excluir</Button>
        </Specimen>
        <Specimen label="Com ícone, só ícone, carregando e desabilitado">
          <Button icon={<Plus aria-hidden size={16} strokeWidth={1.5} />}>Nova caixinha</Button>
          <Tooltip content="Registrar">
            <Button iconOnly aria-label="Registrar">
              <Plus aria-hidden size={20} strokeWidth={1.5} />
            </Button>
          </Tooltip>
          <Button loading>Salvando</Button>
          <Button disabled>Indisponível</Button>
        </Specimen>
      </Section>

      <Section title="Campos">
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <Input label="Descrição" placeholder="Ex.: Supermercado" />
          <Input label="Com dica" hint="Aparece no extrato." defaultValue="Padaria" />
          <Input label="Com erro" error="Informe uma descrição." defaultValue="" />
          <Input label="Desabilitado" disabled defaultValue="Conta corrente" />
          <MoneyInput label="Valor" value={money} onChange={setMoney} />
          <MoneyInput
            label="Valor com erro"
            value={null}
            onChange={() => undefined}
            error="Informe um valor maior que zero."
          />
        </div>
        <p className="text-sm text-fg-muted">
          Valor lido: {money === null ? 'nenhum' : `${money} centavos (${formatMoney(money)})`}
        </p>
        <Specimen label="SegmentedControl">
          <SegmentedControl
            label="Período"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'mes', label: 'Mês' },
              { value: 'trimestre', label: 'Trimestre' },
              { value: 'ano', label: 'Ano' },
            ]}
          />
        </Specimen>
      </Section>

      <Section
        title="Valores"
        description="Amount é a única forma de exibir dinheiro. O modo privacidade oculta todos."
      >
        <Specimen label="Destaque, tamanhos, com sinal e abreviado">
          <Amount value={cents(670371)} size="display" />
          <Amount value={cents(421835)} size="lg" />
          <Amount value={cents(620000)} tone="signed" />
          <Amount value={cents(-5000)} tone="signed" />
          <Amount value={cents(421835)} compact />
        </Specimen>
        <Specimen label="Modo privacidade">
          <Button variant="secondary" aria-pressed={hidden} onClick={toggle}>
            {hidden ? 'Mostrar valores' : 'Ocultar valores'}
          </Button>
        </Specimen>
        <Specimen label="Badges">
          <Badge>Neutro</Badge>
          <Badge tone="accent">Destaque</Badge>
          <Badge tone="positive">+ 4,5%</Badge>
          <Badge tone="negative">Atrasado</Badge>
          <Badge tone="warning">Conferir</Badge>
        </Specimen>
        <div className="max-w-sm">
          <Specimen label="ProgressBar">
            <div className="flex w-full flex-col gap-3">
              <ProgressBar
                label="Reserva de emergência"
                percent={41}
                valueText="R$ 6.200 de R$ 15.000"
              />
              <ProgressBar label="Destacado" percent={75} highlight />
            </div>
          </Specimen>
        </div>
      </Section>

      <Section title="Lista">
        <Card className="max-w-md">
          <List>
            <ListItem
              title="Supermercado"
              subtitle="Mercado"
              trailing={<Amount value={cents(-24180)} size="sm" tone="signed" />}
              trailingSubtitle="12 out"
            />
            <ListItem
              title="Salário"
              subtitle="Salário"
              trailing={<Amount value={cents(620000)} size="sm" tone="signed" />}
              trailingSubtitle="5 out"
            />
            <ListItem title="Item clicável" subtitle="Abre o detalhe" onClick={() => undefined} />
          </List>
        </Card>
      </Section>

      <Section title="Estados" description="Toda tela trata carregando, vazio, erro e sem conexão.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Carregando">
            <LoadingRegion label="Carregando exemplo">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </LoadingRegion>
          </Card>
          <Card title="Vazio">
            <EmptyState
              icon={<Inbox aria-hidden size={24} strokeWidth={1.5} />}
              title="Nenhuma despesa em outubro."
              description="Registre pelo botão + ou pelo WhatsApp."
            />
          </Card>
          <Card title="Erro">
            <ErrorState
              title="Não foi possível carregar."
              description="O servidor não respondeu."
              onRetry={() => undefined}
            />
          </Card>
          <Card title="Sem conexão">
            <div className="-mx-4 -mb-4 overflow-hidden rounded-b-lg sm:-mx-5 sm:-mb-5">
              <OfflineBanner forceOffline />
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Sobreposições">
        <Overlays />
      </Section>
    </div>
  )
}
