import { Construction } from 'lucide-react'
import { Link } from 'react-router'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'

/** Honest placeholder for destinations that arrive in later phases. */
export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h1 className="mb-4 text-xl font-semibold tracking-tight text-fg lg:mb-6 lg:text-2xl">
        {title}
      </h1>
      <Card>
        <EmptyState
          icon={<Construction aria-hidden size={24} strokeWidth={1.5} />}
          title="Esta tela ainda não existe no protótipo."
          description={description}
          action={
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface-2 px-4 text-sm font-medium text-fg hover:bg-surface-3"
            >
              Voltar ao Início
            </Link>
          }
        />
      </Card>
    </>
  )
}
