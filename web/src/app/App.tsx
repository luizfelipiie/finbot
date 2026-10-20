import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { HomePage } from '@/features/home/HomePage'
import { DesignSystemPage } from '@/pages/DesignSystemPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { PrivacyProvider } from './privacy'
import { PrototypeProvider } from './prototype'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'transacoes',
        element: (
          <PlaceholderPage
            title="Transações"
            description="Lista, filtros e revisão do mês chegam na Fase 3."
          />
        ),
      },
      {
        path: 'planejar',
        element: (
          <PlaceholderPage
            title="Planejar"
            description="Compromissos fixos, assinaturas e caixinhas chegam na Fase 4."
          />
        ),
      },
      {
        path: 'carteira',
        element: (
          <PlaceholderPage
            title="Carteira"
            description="A carteira de investimentos com cálculos reais chega na Fase 7."
          />
        ),
      },
      {
        path: 'configuracoes',
        element: (
          <PlaceholderPage
            title="Configurações"
            description="Perfil, ciclo do mês e privacidade chegam na Fase 3."
          />
        ),
      },
      { path: 'design-system', element: <DesignSystemPage /> },
      {
        path: '*',
        element: (
          <PlaceholderPage
            title="Página não encontrada"
            description="O endereço não corresponde a nenhuma tela."
          />
        ),
      },
    ],
  },
])

export function App() {
  return (
    <PrototypeProvider>
      <PrivacyProvider>
        <TooltipProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </TooltipProvider>
      </PrivacyProvider>
    </PrototypeProvider>
  )
}
