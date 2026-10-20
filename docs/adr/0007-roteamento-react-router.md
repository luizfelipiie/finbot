# 0007 — Roteamento com React Router

- Status: aceito, com revisão prevista na Fase 3 · Data: 20/10/2026 · Decisor: Claude, dentro do plano aprovado da Fase 1

## Contexto

O app tem cinco destinos principais, `/design-system` e, a partir da Fase 3, telas de detalhe. Precisa de URLs reais (links compartilháveis, botão voltar), rotas carregadas sob demanda e funcionar como SPA na Vercel.

## Opções

1. **React Router** (modo biblioteca). O mais usado do ecossistema, API estável, `lazy` por rota, `NavLink` com estado ativo.
2. **TanStack Router.** Rotas e parâmetros tipados de ponta a ponta, integração natural com TanStack Query (previsto na Fase 3). Curva maior e mais configuração.
3. **Sem biblioteca** (estado + `history`). Leve, mas reinventa links, rota ativa e carregamento sob demanda.

## Decisão

React Router 8.4, fixado em 8.4.0: a 8.5.0 saiu no dia da instalação e evitamos versões com horas de vida.

## Justificativa da dependência

| Critério | Avaliação |
|---|---|
| O que resolve | URLs, histórico, rota ativa, carregamento sob demanda por rota. |
| Alternativa | TanStack Router (tipagem melhor) ou nenhuma biblioteca. |
| Peso | Segunda maior dependência do bundle, depois do react-dom (cerca de 357 KB de código-fonte antes da minificação). O JS inicial hoje tem 150 KB gzip. |
| Manutenção | Remix/Shopify, releases frequentes. |

## Consequências

- `web/vercel.json` reescreve rotas desconhecidas para `index.html`.
- `/design-system` já é carregada sob demanda.
- **Revisão na Fase 3:** com TanStack Query entrando, comparar TanStack Router e React Router em peso e tipagem e fixar um orçamento de bundle (Lighthouse mobile ≥ 90, briefing §13).
