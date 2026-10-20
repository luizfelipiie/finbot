# 0005 — Componentes próprios sobre Radix primitives

- Status: aceito · Data: 20/10/2026 · Decisor: Claude, dentro do plano aprovado da Fase 1

## Contexto

O briefing exige componentes acessíveis (foco, teclado, ARIA, leitores de tela) com visual próprio, sem "cara de IA", e estilos só por tokens. Dialog, Tooltip, Toast e grupos de seleção são os componentes em que acessibilidade feita à mão costuma falhar.

## Opções

1. **Escrever tudo do zero.** Nenhuma dependência, mas reimplementar focus trap, `aria-modal`, retorno de foco, navegação por setas e anúncios de toast é caro e propenso a erro.
2. **shadcn/ui customizado.** São componentes Radix copiados para o projeto, com convenções próprias (`cva`, `tailwind-merge`, nomes de tokens do shadcn). Acelera, mas traz uma camada de convenções que teríamos de desfazer para usar nossos tokens e escala de raios.
3. **Radix primitives direto** (pacote `radix-ui`), com nossos componentes por cima. Comportamento acessível pronto, visual 100% nosso.

## Decisão

Opção 3. Usamos `radix-ui` 1.8 para Dialog/BottomSheet, Tooltip, Toast e ToggleGroup (SegmentedControl). Button, Input, MoneyInput, Card, Badge, ProgressBar, Amount, List e estados são componentes simples em `web/src/components/ui/`, sem dependência.

## Justificativa da dependência

| Critério | Avaliação |
|---|---|
| O que resolve | Focus trap, Escape, retorno de foco, `aria-*`, navegação por teclado, região viva de toasts. |
| Alternativa | shadcn/ui (mesma base, mais convenções) ou implementação própria. |
| Peso | Tree-shaken: só os primitivos importados entram. Toast, Tooltip (com Floating UI) e Dialog somam cerca de 150 KB de código-fonte antes da minificação. Tooltip é o mais caro e pode sair se não for usado nas telas reais. |
| Manutenção | Mantido pela WorkOS, releases frequentes, amplamente usado. |

## Consequências

- Testes de componente (Testing Library) cobrem teclado e ARIA dos componentes interativos; o axe roda no E2E.
- O BottomSheet é um Dialog ancorado embaixo: não tem gesto de arrastar para fechar. Se o uso real pedir, avaliar `vaul` na Fase 3.
