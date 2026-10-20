# 0006 — Fonte Geist, auto-hospedada

- Status: aceito · Data: 20/10/2026 · Decisor: Claude, dentro do plano aprovado da Fase 1

## Contexto

O briefing pede uma família sans profissional, Inter ou Geist, pesos 400/500/600 e algarismos tabulares em valores. O app antigo carregava Inter em 6 pesos do Google Fonts (achado B-03), com requisição a terceiro em toda visita.

## Opções

1. **Inter.** Excelente legibilidade e números tabulares; é também a fonte mais associada a interfaces genéricas, justamente o que o briefing quer evitar.
2. **Geist.** Desenhada para interfaces, com algarismos tabulares e desenho mais geométrico e compacto. Os números grandes do saldo ficam firmes, o que combina com a direção sóbria preto e amarelo.

## Decisão

Geist Variable, via `@fontsource-variable/geist` 5.3 (licença OFL), auto-hospedada no bundle. Um único arquivo variável cobre os pesos 400 a 600.

## Consequências

- Nenhuma requisição ao Google Fonts: melhor privacidade (o app guarda dados financeiros) e nenhum bloqueio de renderização por terceiro.
- O subset latino tem cerca de 29 KB (woff2); os demais subsets só são baixados se houver caracteres daquele alfabeto.
- `tabular-nums` aplicado pelo utilitário `tabular` em todo valor monetário.
