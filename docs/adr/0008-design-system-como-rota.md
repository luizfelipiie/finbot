# 0008 — Design system como rota do app, não Storybook

- Status: aceito · Data: 20/10/2026 · Decisor: Claude, dentro do plano aprovado da Fase 1

## Contexto

O briefing pede uma rota `/design-system` ou Storybook, com justificativa, para revisar tokens e componentes em todos os estados.

## Opções

1. **Storybook.** Padrão de mercado, isolamento por componente, addons de acessibilidade. Traz dezenas de dependências de desenvolvimento, um segundo build e um segundo deploy para manter.
2. **Rota `/design-system` no próprio app.** Zero dependência nova, usa exatamente os mesmos tokens, providers e CSS de produção, e é publicada junto com o app (o mesmo link de preview serve para revisar).

## Decisão

Rota `/design-system`, carregada sob demanda para não pesar no bundle inicial.

## Consequências

- A página lê os tokens computados e recalcula a tabela de contraste WCAG ao trocar a cor de destaque.
- O E2E abre a página nas duas larguras, roda o axe e falha se algum par de contraste reprovar.
- Sem isolamento por componente nem testes visuais automáticos. Se a biblioteca crescer muito (Fases 4 a 7), reavaliar Storybook.
