# Fase 1 — Plano: correções críticas e design system

> Status: **aguardando aprovação** · Branch: `fase-1-correcoes-e-design-system` · Tamanho: **G**
> Referências: briefing seções 6, 7.1, 7.2, 8 e 14 · `docs/diagnostico.md` · ADRs 0001–0004.

## Objetivo

Criar a base visual e técnica do app novo: tokens, componentes acessíveis com todos os estados, a rota `/design-system`, o protótipo navegável do Início com dados fictícios em 390px e 1280px nas 3 opções de amarelo, e a navegação para você validar. Tudo com CI desde o primeiro commit.

## Já feito (contenção aprovada, commit `3abdbd3`)

- API escutando só em `127.0.0.1` e CORS restrito à origem da UI (C-06).
- Erro explícito com porta ocupada (A-12) e recusa em iniciar com arquivo ilegível (C-05).
- Backup antes de cada escrita e gravação atômica (C-05).
- `finbot-data.json`, backups e `.env*` no `.gitignore` (A-08).
- Testado numa cópia isolada, sem tocar nos dados locais.

## Escopo

1. **Reorganizar o repositório** (ver "Decisão 1" abaixo):
   ```
   legacy/   app atual, intacto e ainda executável (removido na Fase 3, com sua aprovação)
   web/      app novo (React + Vite + TS strict)
   api/      reservado para o Spring Boot (Fase 2)
   docs/
   ```
2. **Correção crítica restante no legado:** `npm audit fix` (A-11). Os bugs de cálculo do legado (C-01 a C-04) **não** serão corrigidos, porque os dados são fictícios e o app será substituído; corrigi-los seria trabalho descartado.
3. **Fundação do `web/`:** TypeScript `strict`, ESLint + Prettier, Vitest + Testing Library, Playwright (prints em 390/1280 e verificação de acessibilidade com axe).
4. **CI no GitHub Actions:** lint, typecheck, testes, build, gitleaks e `npm audit`. PR só entra com tudo verde.
5. **Tokens** em CSS variables consumidas pelo Tailwind 4 (cor, raio, espaçamento, tipografia, movimento, z-index), com as 3 opções de amarelo alternáveis por `data-accent`. Teste automatizado do contraste WCAG 2.2 AA de cada par texto/fundo.
6. **Utilitários centrais com testes:** dinheiro em centavos (`formatMoney`, `formatMoneyCompact` → "R$ 4,2 mil", `parseMoneyInput` pt-BR, cobrindo o caso C-01) e datas no fuso do usuário ("Hoje", "Ontem", "19 out", "19/10/2026").
7. **Componentes base** (com estados de foco, desabilitado, carregando e erro quando se aplicar):
   Button (primário, secundário, ghost, destrutivo), Input, MoneyInput, Card, SegmentedControl, Badge, Tooltip, Dialog, BottomSheet, Toast, ProgressBar, Amount, EmptyState, Skeleton, ErrorState e List.
   **Adiados para a Fase 3**, porque o Início não usa: Select, DatePicker, Tabs e Table.
8. **Rota `/design-system`** mostrando tokens, contrastes e todos os componentes em todos os estados. Escolhida no lugar do Storybook porque não traz dependência pesada nem um segundo build, e é publicada junto com o app (ADR).
9. **Shell de navegação:** barra inferior no mobile (Início · Transações · [+] · Planejar · Carteira), lateral no desktop (máx. ~1200px) e avatar levando a Configurações. Destinos que ainda não existem mostram um estado vazio honesto ("Disponível em breve").
10. **Protótipo do Início** com dados fictícios realistas, seguindo a seção 7.2: saudação, modo privacidade, cartão de saldo, resumo do ciclo com comparação justa, rosca "Para onde foi sua renda" (com parte prevista hachurada e os casos de estouro e de ausência de receita), próximas cobranças, pendências, caixinhas, carteira e últimas transações. Seletor das 3 opções de amarelo visível só no protótipo.
11. **ADRs:** 0005 biblioteca de componentes (Radix primitives × shadcn/ui), 0006 fonte (Inter × Geist, auto-hospedada), 0007 roteamento, 0008 `/design-system` × Storybook. Cada dependência nova com justificativa: o que resolve, alternativa, peso no bundle e saúde da manutenção.
12. **WhatsApp:** passo a passo para você abrir a conta Meta Business e reservar o número dedicado (prazo externo da Fase 6), com fontes oficiais citadas.
13. **Relatório** `docs/fases/fase-1.md` com prints em 390px e 1280px das 3 opções de amarelo.

## Fora de escopo

Back-end novo, autenticação, banco, dados reais, telas além do Início, PWA (Fase 3), tema claro (os tokens ficam preparados), correções de cálculo no legado.

## Modelo de dados

Nenhuma mudança. O protótipo usa um módulo de dados fictícios tipado no formato do rascunho da seção 5.1 do diagnóstico (centavos, `occurred_on` como data local), para que a troca pela API na Fase 3 não exija remodelagem.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Design system crescer além do necessário | Só os componentes que o Início usa + base; o resto foi explicitamente adiado. |
| Amarelo-lima ou âmbar falharem em contraste em algum uso | Teste automatizado de contraste; a opção reprovada é mostrada com a ressalva, não ajustada em silêncio. |
| Dados fictícios parecerem reais nos prints | Nomes e valores claramente de demonstração e uma faixa "Dados fictícios" no protótipo. |
| Mover o legado quebrar `npm run dev` | O README e o `CLAUDE.md` ganham os comandos novos; um smoke test confirma que o legado sobe em `legacy/`. |

## Estratégia de testes

- Unitários (Vitest): formatação e parsing de dinheiro e datas, cálculo de contraste e as derivações do protótipo (fatias da rosca, estouro, comparação de ciclo).
- Componentes (Testing Library): teclado, foco, `aria-*` e estados dos componentes interativos (Button, Dialog, BottomSheet, SegmentedControl, MoneyInput, Toast).
- E2E e acessibilidade (Playwright + axe): `/` e `/design-system` sem violações sérias em 390px e 1280px; prints gerados pelo próprio teste.

## Critérios de aceite

- [ ] CI verde no PR: lint, typecheck, testes, build, gitleaks e audit.
- [ ] `npm audit` sem vulnerabilidade alta ou crítica em `legacy/` e `web/`.
- [ ] Nenhuma cor literal fora do arquivo de tokens (verificado por regra de lint ou grep no CI).
- [ ] Todos os pares texto/fundo passam AA no teste, ou a exceção aparece documentada no relatório.
- [ ] `/design-system` mostra cada componente em todos os seus estados.
- [ ] Início navegável em 390px e 1280px nas 3 opções de amarelo, com modo privacidade e os casos de estouro e sem receita.
- [ ] Zero emojis; alvos ≥ 44px; foco visível; `prefers-reduced-motion` respeitado.
- [ ] `legacy/` continua subindo com um comando documentado.
- [ ] ADRs 0005–0008 e relatório com prints.

## Decisões que preciso de você antes de começar

1. **Reorganização do repositório** em `legacy/` + `web/` + `api/` (recomendado). A alternativa é construir o app novo por cima do atual, mas o legado ficaria quebrado durante as Fases 1 a 3.
2. **Preview na Vercel:** conectar o repositório à sua conta Vercel para cada PR gerar um link e você avaliar o protótipo no celular (recomendado; exige que você faça o login e a conexão). Sem isso, a revisão fica pelos prints.
