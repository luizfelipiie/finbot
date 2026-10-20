# FinBot — Diagnóstico (Fase 0)

> Data: 19/10/2026 · Base: `main` local em `17e966f` (o remoto tem 1 commit a mais, só README) · Fonte de verdade: `briefing-finbot.md`.
> Nenhum código da aplicação foi alterado nesta fase. Referências `arquivo:linha` são relativas a `finbot/`.
> Este repositório é público: este documento não reproduz nenhum conteúdo do arquivo de dados pessoais.

## 0. Discrepâncias encontradas antes de começar

| # | Discrepância | Impacto | Proposta |
|---|---|---|---|
| D1 | O briefing e as imagens estão em `projeto_finanças/` (fora do repositório), não em `finbot/docs/` e `finbot/docs/referencias/`. A imagem 00 se chama `00-estado-atual.png.png`. | Os caminhos do briefing não batem. | Mover para `finbot/docs/` e `finbot/docs/referencias/` no início da Fase 1 (decisão sua: as referências 01–03 são de terceiros; versionar num repo público pode não ser adequado. Sugiro versionar só o briefing e o print 00, sem dados pessoais visíveis). |
| D2 | O repositório local está 1 commit atrás de `origin/main` (`d3d29dd`, README). O remoto foi renomeado para `luizfelipiie/finbot` (o antigo `projeto-financas` redireciona). | Branch da Fase 1 nasceria desatualizada. | `git pull` e atualizar a URL do remoto antes da Fase 1. |
| D3 | "2 perfis" (seção 7.7): não há propósito de produto por trás. São dois perfis "Meu Perfil" criados com 22 ms de diferença — bug de inicialização duplicada (ver A-09). O README afirma suporte a "você, cônjuge ou empresa". Os dois perfis acabaram recebendo dados de contextos diferentes. | A decisão sobre perfis precisa partir disso. | Ver seção 5.3. |
| D4 | Seção 4, "ordem e horário inconsistentes": a ordem **está** cronológica (o card das 22:41 é de 16/06; as mensagens das 18:35 são de 07/08). O defeito real é a ausência de data e separador por dia. | Muda a correção. | Ver M-01. |
| D5 | Existe `MVP_SPECIFICATION.md` (chat-first, Open Finance, LLM como núcleo) que contradiz o briefing (painel-first, LLM só como fallback). | Duas fontes de verdade. | Arquivar como histórico; o briefing prevalece. Confirmar. |
| D6 | **Incidente desta fase:** durante a reprodução do chat, um servidor da API que sobreviveu à sessão anterior (processo órfão do `concurrently`) estava na porta 3001; minha cópia isolada falhou em subir sem erro visível (ver A-12) e as requisições de teste foram gravadas no `finbot-data.json` real: 3 transações e 8 mensagens, todas com `createdAt`/`timestamp` iniciando em `2026-10-20T02:09`. Nada mais foi alterado. | Dados reais contaminados com teste. | Remover essas entradas (precisa da sua autorização). |

## 1. Stack, arquitetura e fluxo de dados atuais

**Stack:** React 19 + Vite 8 + TypeScript 6 (sem `strict`) + Tailwind 4 (praticamente não usado: estilos inline) + Framer Motion + Recharts + Zustand · API Node + Express 5 · persistência em **um arquivo JSON**. Sem testes, sem CI, sem autenticação. ~3.000 linhas de código próprio.

```
 Navegador (localhost:5173)                       Node (0.0.0.0:3001)
 ┌──────────────────────────────────────┐         ┌──────────────────────────────┐
 │ Componentes ──► useFinanceStore      │  /api   │ server/index.js (CRUD aberto)│
 │                 (Zustand)            │ ──────► │   sem auth, CORS *           │
 │   • estado inteiro do perfil em      │  proxy  │ server/storage.js            │
 │     memória                          │  Vite   │   db inteiro em memória      │
 │   • "NLP" por regex NO NAVEGADOR     │         │   writeFileSync a cada save  │
 │   • saldos/insights calculados       │         └──────────────┬───────────────┘
 │     no cliente (float)               │                        ▼
 └──────────────────────────────────────┘           finbot-data.json (fora do git,
                                                     mas fora do .gitignore; pasta
                                                     sincronizada pelo OneDrive)
```

- **Persistência:** `server/storage.js` carrega o JSON uma vez (`load`, :12) e regrava o arquivo inteiro a cada escrita (`save`, :22). Nada de banco, transação, lock ou backup. Nenhum `localStorage`.
- **Chat:** não há back-end de chat nem LLM. `processUserMessage` (`src/store/useFinanceStore.ts:394`) roda no navegador: espera 0,6–1 s artificiais (:398), testa regex em ordem (:402–422), extrai valor (:130) e categoria (:119) e chama `addTransaction`. A resposta do bot é gerada no cliente e persistida por um POST "fire-and-forget" (:375–380).

### 1.1 Por que o chat "não responde"

**O que verifiquei:** reproduzi o fluxo com o código atual sobre uma cópia dos dados (script em Node carregando o store via Vite). "Ver saldo" e "Gastei R$50 no mercado" **receberam resposta**. Logo, o código não falha de forma determinística com esses dados.

**O que os dados mostram (07/08):** as duas mensagens do usuário foram persistidas, mas nem a resposta do bot nem a transação de R$ 50 chegaram ao servidor. Ou seja, o `processUserMessage` não chegou ao `addMessage`/`addTransaction`, ou as chamadas falharam.

**Causa raiz que dá para afirmar:** a arquitetura torna qualquer falha **invisível**. Não consigo provar qual falha ocorreu em 07/08 justamente porque nada foi registrado:

1. A resposta só existe se a aba sobreviver ao atraso artificial: a mensagem do usuário é gravada antes (`ChatInput.tsx:28,47`), a resposta depois de `sleep` (`useFinanceStore.ts:398`). Recarregar, fechar ou perder a aba nesse intervalo produz exatamente o padrão observado.
2. Erros de persistência são engolidos: `.catch(() => {/* fire-and-forget */})` (`useFinanceStore.ts:380`).
3. `send`/`handleQuick` fazem `await processUserMessage` sem `try/catch` (`ChatInput.tsx:29,48`): qualquer exceção vira *unhandled rejection* sem feedback na tela.
4. `init`/`loadProfile` não tratam erro (`useFinanceStore.ts:240–287`): API fora do ar = "Carregando seus dados..." eterno.
5. O servidor não registra nada além do "API rodando", e esse texto aparece **mesmo quando a porta está ocupada e o servidor não sobe** (`server/index.js:151` — o Express 5 passa o erro ao callback, que o ignora). Foi o que causou o incidente D6.
6. O status "Online · Resposta imediata" é texto fixo (`ChatView.tsx:41`).

## 2. Inventário de funcionalidades

| Funcionalidade | Estado | Observação |
|---|---|---|
| Perfis (criar, trocar, excluir) | Parcial | Duplica o perfil inicial (A-09); excluir apaga tudo sem confirmação (C-04). |
| Contas (criar) | Parcial | Sem editar nem excluir na UI (`updateAccount`/`removeAccount` existem no store e nunca são usados). Cartão de crédito tratado como dinheiro (C-03). |
| Filtro por conta | Funciona | — |
| Transações (criar/editar/excluir pelo modal) | Parcial | Valores com milhar são corrompidos (C-01); data em UTC (C-02); exclusão definitiva. |
| Lista de transações com busca e filtro de tipo | Funciona | Sem agrupamento por dia, sem paginação. |
| Saldo / Entrada / Saída | Quebrada | "Entrada/Saída" são totais de todos os tempos, não do mês (A-04); saldo inclui cartão como ativo (C-03). |
| Chat: registrar gasto/receita | Parcial | Funciona no caminho feliz; grava sem confirmação qualquer frase com número (A-06); falhas silenciosas (seção 1.1). |
| Chat: saldo, resumo, metas, contas | Parcial | "Resumo do mês" usa todas as transações (`useFinanceStore.ts:418`); "contas" mostra o saldo inicial, não o atual (:409). |
| Metas | Parcial | É o embrião das caixinhas, mas `current` é um número digitado, sem ligação com contas ou transferências. Migração: seção 5.1. |
| Insights | Quebrada / enganosa | Gráfico "Tendência 6 meses" com dados inventados fixos no código (`InsightsView.tsx:6–13`); selo "IA Preditiva Ativa · Monitorando em tempo real" sem nenhuma IA (`InsightsView.tsx:51–58`). |
| Configurações, Sair | Inexistente | Botões sem ação (`Sidebar.tsx:286–303`). |
| Anexo, câmera, emoji, microfone, busca, notificações, menu | Inexistente | Botões decorativos sem ação (`ChatInput.tsx:104–163`, `ChatView.tsx:48–83`). |
| Selos "3" em Metas e "!" em Insights | Fictício | Fixos no código (`Sidebar.tsx:12–13`). |

## 3. Achados por severidade

Legenda: **C** crítica · **A** alta · **M** média · **B** baixa. "Confirmado" = reproduzido ou visto nos dados.

### Crítica

- **C-01 · Valores pt-BR com milhar são corrompidos (confirmado).** `parseFloat(x.replace(',', '.'))` troca só a primeira vírgula: "R$ 1.234,56" vira **1,234** e "1.500" vira **1,5**. Em `useFinanceStore.ts:133`, `TransactionModal.tsx:41`, `GoalModal.tsx:36`, `AccountModal.tsx:41`. Reproduzido no chat.
- **C-02 · Data da transação em UTC (confirmado).** `new Date().toISOString().split('T')[0]` em `useFinanceStore.ts:431`, `TransactionModal.tsx:25,34`. Depois das 21h em Brasília o lançamento cai no dia seguinte — e no último dia do mês, no mês seguinte. Evidência nos dados: a receita de 16/06 às 22:39 está gravada como 17/06. Reproduzido hoje (19/10, 23h → gravado 20/10).
- **C-03 · Saldo soma cartão de crédito como dinheiro; Entrada/Saída não são do mês.** `computeDerived` soma `initialBalance` de todas as contas, inclusive `credit` (`useFinanceStore.ts:73`). Explica o print: R$ 6.000 = R$ 4.000 de receita + R$ 2.000 de "saldo inicial" do cartão Itaú. Saldo também é editável por fora (`PUT /api/accounts/:id` aceita `initialBalance`).
- **C-04 · Exclusões em cascata, definitivas e sem confirmação.** `DELETE /api/profiles/:id` apaga contas, transações, metas e mensagens (`server/index.js:24–34`), acionado por um ícone que aparece no hover, sem confirmação (`Sidebar.tsx:116`). `DELETE /api/accounts/:id` apaga as transações da conta (`server/index.js:58–64`).
- **C-05 · Perda total de dados em arquivo corrompido.** Se o JSON não puder ser lido, `load` começa vazio em silêncio (`storage.js:17–19`) e o próximo `save` sobrescreve o arquivo inteiro. A escrita não é atômica (`storage.js:23`): uma queda no meio da gravação corrompe o arquivo e dispara esse caminho.
- **C-06 · API sem autenticação, aberta na rede local.** Sem login; CORS liberado para qualquer origem (`server/index.js:8`); escuta em `0.0.0.0` (verificado com `netstat`), portanto acessível por qualquer aparelho na mesma rede (ex.: Wi-Fi público). Qualquer pessoa pode listar perfis e ler, alterar ou apagar tudo.

### Alta

- **A-01 · Dinheiro em ponto flutuante** em todo o app (`amount: number`, somas com `+`, formatação com `toFixed`).
- **A-02 · Mass assignment e IDOR.** `{ id: uuid(), ...req.body }` e `{ ...registro, ...req.body }` (`server/index.js:18,43,53,73,83,102,112,134`) permitem trocar `profileId` e `id` pelo corpo da requisição. `PUT`/`DELETE` por id não verificam o dono. Nenhuma validação de entrada.
- **A-03 · Transferência não existe.** Não há tipo de transferência; mover dinheiro para meta ou pagar fatura só é registrável como despesa, o que distorce todos os totais.
- **A-04 · "Entrada/Saída" e "resumo do mês" são de todos os tempos.** `monthlyIncome`/`monthlyExpenses` não filtram por data (`useFinanceStore.ts:69–78`).
- **A-05 · Falhas silenciosas** (seção 1.1): `useFinanceStore.ts:380`, `ChatInput.tsx:29,48`, `useFinanceStore.ts:240`, `server/index.js:151`, `storage.js:17`. `AccountModal`/`ProfileModal` chamam ações assíncronas sem `await` (`AccountModal.tsx:37`, `ProfileModal.tsx:19`).
- **A-06 · Chat grava qualquer frase com número como despesa, sem confirmar.** Ex.: um empréstimo a receber virou despesa na categoria Outros. A descrição mantém números e ruído ("1.500 aluguel"). A palavra "pagamento" classifica como **receita** (`useFinanceStore.ts:116`).
- **A-07 · Dados de demonstração inventados e selos falsos** (Insights, badges, "Online"). Viola diretamente a seção 12 ("interface honesta").
- **A-08 · Dados pessoais fora do `.gitignore`.** `finbot-data.json` nunca foi commitado (gitleaks e `git log` confirmam), mas um `git add .` o publica num repositório público. A pasta também é sincronizada pelo OneDrive.
- **A-09 · Perfil inicial duplicado.** `StrictMode` (`main.tsx:7`) executa o efeito de `init` duas vezes (`App.tsx:53`); as duas execuções veem a lista vazia e criam um perfil cada (`useFinanceStore.ts:242–244`). Evidência: dois perfis criados com 22 ms de diferença.
- **A-10 · Menu lateral sobreposto (confirmado no código).** O `nav` tem `flex-1 min-h-0` sem `overflow` (`Sidebar.tsx:239`): quando a altura da tela não comporta perfil, cartão de saldo, contas e menu, o `nav` encolhe abaixo do conteúdo, que transborda por baixo do bloco fixo "Configurações / Sair" (`Sidebar.tsx:284`).
- **A-11 · Dependências:** `npm audit` aponta 1 crítica (`proxy-addr`, via Express) e 1 moderada (`qs`) em produção, e mais 2 em dev (`brace-expansion` alta, `baseline-browser-mapping` moderada). Correção disponível via `npm audit fix`.
- **A-12 · Servidor finge que subiu.** O callback do `app.listen` ignora o erro (`server/index.js:151`); porta ocupada → mensagem de sucesso e nenhum servidor. Combinado com processos órfãos do `concurrently`, permite que um servidor antigo, com estado em memória desatualizado, continue gravando no arquivo.

### Média

- **M-01 · Chat sem data.** Só hora (`ChatMessage.tsx:212`), sem separador por dia; mensagens de meses diferentes parecem fora de ordem.
- **M-02 · Card "Gastos por categoria" vazio.** O gráfico filtra só despesas (`ChatMessage.tsx:50–51`); sem despesas, renderiza rosca e barras vazias, sem estado vazio (`ChatMessage.tsx:199`). Além disso usa rosca para comparar categorias, contra a seção 8.
- **M-03 · Formatação misturada.** "R$ 4.0k" via `(v/1000).toFixed(1)` (`Sidebar.tsx:156,160`) ao lado de `toLocaleString('pt-BR')`. Formatação espalhada em ~15 lugares, sem função única.
- **M-04 · TypeScript sem `strict`** (`tsconfig.app.json` não o habilita); `tsc -b` passa, mas sem garantias. Muitos `as` forçados no store (`useFinanceStore.ts:241,258,310`).
- **M-05 · ESLint com 2 erros:** `setState` dentro de efeito (`TransactionModal.tsx:30`) e `Date.now()` durante o render (`GoalsView.tsx:68`).
- **M-06 · Zero testes e nenhum CI.**
- **M-07 · Prazo de metas com fuso errado.** `new Date('2027-04-22')` é meia-noite UTC (`GoalsView.tsx:68`): "dias restantes" pode errar em um dia.
- **M-08 · Estado de erro, vazio e carregamento ausentes** na maioria das telas; `confirm()` nativo para exclusão (`TransactionsView.tsx:132`, `GoalsView.tsx:98`).

### Baixa

- **B-01 · Visual "cara de IA":** emojis como ícones e avatares, verde e roxo concorrendo, gradientes e *glow* (`index.css:65–106`, `App.tsx:60–61`), `rounded-2xl` generalizado, cores fixas inline em todos os componentes (sem tokens), avatar genérico "U" (`ChatMessage.tsx:173`).
- **B-02 · Acessibilidade:** botões só com ícone sem `aria-label` (apenas `title` ou nada: `ChatView.tsx:48–83`); textos a 25–35% de opacidade, provavelmente abaixo de AA (`ChatMessage.tsx:211`, `Sidebar.tsx:60`); sem `prefers-reduced-motion`; animações de 0,3–0,8 s com *overshoot*; `index.html` com `lang="en"`; nenhuma navegação por teclado pensada.
- **B-03 · Desempenho:** Inter 300–800 do Google Fonts (6 pesos); Recharts e Framer Motion no bundle inicial.
- **B-04 · Porta e configuração fixas** no código (`server/index.js:150`); sem `.env.example`.

### Segredos

Nenhum. `gitleaks` 8.30.1 sobre o histórico (3 commits locais + o commit remoto) e sobre a árvore de trabalho: *no leaks found*. Não existe nenhuma variável `VITE_*` nem chave de serviço no código.

## 4. Recomendação por camada e stack-alvo

| Camada | Recomendação | Por quê | Custo |
|---|---|---|---|
| Front | **Reescrever**, reaproveitando a base de ferramentas (Vite, React, TS, Tailwind, Lucide, Recharts) | Nenhum componente usa tokens; estilos inline com cores fixas em todos os arquivos; navegação chat-first; lógica de domínio dentro do store do cliente. Refatorar custaria mais do que reconstruir sobre o design system. | G |
| Back | **Reescrever** | CRUD aberto sem auth, validação nem domínio; nada é aproveitável além do formato das rotas. | G |
| Banco | **Substituir** o JSON por PostgreSQL gerenciado, com migrações | Integridade, concorrência, backup e isolamento por usuário são impossíveis no arquivo. | M |

**Front-end (proposta):** React + Vite + TypeScript `strict` · Tailwind com tokens em CSS variables · Radix primitives (ou shadcn/ui customizado) para acessibilidade · TanStack Query · React Hook Form + Zod · Recharts carregado sob demanda · Lucide · `vite-plugin-pwa`. Remover Framer Motion (o movimento previsto cabe em CSS) e Zustand (o estado do servidor vai para o TanStack Query; o pouco estado de UI cabe em contexto). Cada dependência será justificada no ADR da Fase 1.

**Back-end — a decisão é sua:**

| Critério | TypeScript (ex.: Hono/Fastify ou funções da Vercel + Supabase) | Java 21 + Spring Boot |
|---|---|---|
| Produtividade aqui | Maior: uma linguagem só, tipos e Zod compartilhados com o front, Supabase Auth + RLS prontos. | Menor no início: dois ecossistemas, DTOs duplicados (mitigável gerando o cliente via OpenAPI). |
| Domínio financeiro | Bom com cuidado (`bigint`/centavos, biblioteca decimal). | Excelente: `BigDecimal`, `java.time` (`LocalDate`, `ZoneId`), JPA/Flyway, Testcontainers. |
| Deploy | Tudo na Vercel; filas e agendamentos dependem de serviço externo (ex.: Supabase Cron/pgmq ou QStash — a confirmar). | Front na Vercel e API num host de containers (Fly.io, Render, Railway…). Mais uma peça para operar; *free tiers* costumam hibernar (cold start ruim para webhook). **Preços e limites a confirmar na documentação vigente antes do ADR.** |
| Webhook do WhatsApp e workers | Funções serverless servem para receber e enfileirar; o processamento precisa de fila externa. | Processo sempre ligado resolve fila, agendamentos e cotações no mesmo serviço (`@Scheduled`, fila em Postgres). |
| Valor de portfólio para vaga back-end Java | Baixo. | Alto: demonstra exatamente o que você busca, num domínio com regras reais. |

**Minha recomendação:** Java 21 + Spring Boot como API e núcleo de domínio, PostgreSQL gerenciado (Supabase ou Neon, usando só o banco) e front na Vercel. Autenticação no Spring Security, com sessão em cookie httpOnly, ou com Supabase Auth validando o JWT no back — a escolha entre as duas vai em ADR na Fase 2. Na escala do beta, o custo de produtividade é pequeno; o ganho de portfólio e a robustez do domínio (`BigDecimal`, `java.time`, processo contínuo para webhook e agendamentos) compensam. O trade-off real é operar dois deploys e pagar um host sempre ligado. Se a prioridade absoluta for chegar ao beta o quanto antes, a escolha é TypeScript + Supabase.

## 5. Rascunho do modelo de dados e da arquitetura de informação

### 5.1 Modelo de dados (rascunho — o esquema final vem na Fase 2)

```
users(id, name, email, timezone='America/Sao_Paulo', cycle_start_day=1, created_at, deleted_at)
workspaces(id, owner_id→users, name, kind: personal|shared)        -- ver 5.3
workspace_members(workspace_id, user_id, role)
accounts(id, workspace_id, name, kind: checking|savings|cash|credit_card|savings_box|investment,
         institution, opening_balance_cents BIGINT, opening_date DATE,
         closing_day, due_day,                                     -- só cartão
         archived_at, created_at, deleted_at)
categories(id, workspace_id, parent_id, name, kind: income|expense, default_nature: fixed|variable)
merchants(id, workspace_id, name) · merchant_aliases(merchant_id, pattern)
transactions(id, workspace_id, kind: income|expense|transfer,
             amount_cents BIGINT CHECK (>0), occurred_on DATE,
             account_id, counter_account_id,                        -- transfer
             category_id, merchant_id, nature, payment_method,
             recurrence_id, installment_group_id, installment_no, installment_total,
             source: manual|app_chat|whatsapp|import, idempotency_key UNIQUE(workspace_id, source, key),
             review_status, original_description, note,
             created_at timestamptz, updated_at, deleted_at)
classification_rules(id, workspace_id, priority, match_field, match_op, match_value,
                     set_category_id, set_merchant_id, set_nature)
recurrences(id, workspace_id, name, expected_amount_cents, variable_amount, frequency,
            day, account_id, category_id, starts_on, ends_on, status, remind)
savings_boxes(account_id PK→accounts, target_cents, target_date, planned_monthly_cents,
              yield_pct_cdi, is_emergency_fund, status: active|done|archived)
audit_log(id, user_id, action, entity, entity_id, at timestamptz, meta jsonb)
-- investimentos (Fase 7): assets, trades, income_events, market_quotes, index_series
```

Saldo = `opening_balance + Σ entradas − Σ saídas`, transferências inclusive, sempre derivado. Cartão: a fatura é derivada de `closing_day`/`due_day`.

**Migração dos dados atuais (em script, com relatório antes de aplicar):** perfis → workspaces; contas → accounts (o "Itaú" do tipo `credit` com saldo inicial positivo é ambíguo: cartão com limite? conta digitada errado? **você decide**); transações → `amount_cents` arredondado com relatório, datas gravadas em UTC corrigidas onde o `createdAt` indicar o dia anterior em Brasília (lista para conferência); metas → caixinhas, com o `current` virando um aporte inicial (transferência de qual conta? **você decide**); lançamentos que não são despesa (empréstimo a receber) listados para decisão; mensagens do chat não migram (proposta).

### 5.2 Arquitetura de informação (validar na Fase 1)

```
Mobile (barra inferior)                       Desktop (barra lateral, máx. ~1200px)
Início | Transações | [+] | Planejar | Carteira  mesmos destinos + Configurações no rodapé
  └ Transações: Lista · Revisão do mês
  └ Planejar:   Compromissos fixos · Caixinhas
  └ Avatar (topo) → Configurações
  └ Chat: não é destino; entra pelo [+] ("Registrar por texto") e pelo WhatsApp
```

Concordo com a mudança para **painel-first**. Hoje o chat é o único caminho de registro, não tem confirmação nem desfazer, e é onde estão as falhas silenciosas; como tela inicial, ele esconde o que o usuário mais quer ver (saldo e mês). Mantê-lo como canal de entrada preserva o diferencial sem custar confiança.

### 5.3 Perfis — proposta

Os "2 perfis" atuais são um bug (A-09), não uma decisão de produto. O próprio uso, porém, mostra demanda por separar contextos. Opções:

1. **Remover perfis:** um usuário, um conjunto de dados. É o mais simples, mas fecha a porta.
2. **Workspaces** (recomendado): cada usuário nasce com um espaço pessoal; o modelo já tem `workspace_id` desde a Fase 2. Na UI do beta só existe o espaço pessoal; "espaço compartilhado (casal/família)" e "negócio" entram depois, sem migração.
3. **Manter perfis como hoje** (vários conjuntos de dados sob o mesmo login): não recomendo, porque confunde autorização e LGPD (de quem são os dados?).

## 6. Proposta de `CLAUDE.md` (criar só após aprovação)

```markdown
# FinBot — regras permanentes

Fonte de verdade: `docs/briefing-finbot.md`. Leia só a seção da fase corrente, sob demanda.
Diagnóstico: `docs/diagnostico.md`. Decisões: `docs/adr/`. Relatórios: `docs/fases/`.

## Processo
- Fases: plano → aprovação do Luiz → implementação → relatório → aprovação. Nunca emende fases.
- Uma branch por fase (`fase-N-descricao`), Conventional Commits em inglês, PR com checklist; CI verde para entrar. Sem force-push na `main`.
- Não remover funcionalidade, não ampliar escopo, não adicionar dependência sem justificativa (o que resolve, alternativa, peso, manutenção) e aprovação.
- Discrepância entre briefing, código e dados: mostre antes de resolver. Ambiguidade que muda resultado: pergunte.
- Decisão relevante → ADR curto em `docs/adr/NNNN-titulo.md` com opções, trade-offs e fonte oficial citada.
- Não invente comportamento de API externa, preço, cotação, índice ou regra tributária: consulte a documentação vigente e cite.
- Português com o Luiz e na UI (pt-BR); código, identificadores e commits em inglês.

## Núcleo financeiro (inegociável)
- Dinheiro em centavos inteiros (BIGINT) ou decimal; nunca float; `toFixed` não calcula.
- Saldo sempre derivado (saldo inicial + transações).
- Data da transação = DATE no fuso do usuário (America/Sao_Paulo); timestamps técnicos em UTC. Nunca `toISOString().split('T')[0]`.
- Transferência é tipo próprio (caixinha, investimento, pagamento de fatura) e nunca conta como receita/despesa.
- Todo lançamento tem origem e chave de idempotência; exclusão lógica (`deleted_at`).
- Todo dado tem dono; toda consulta é filtrada por ele, com teste de isolamento.
- O LLM nunca produz números; totais vêm de consultas determinísticas.
- Todo número exibido é detalhável até as transações.

## Segurança
- Nenhum segredo no front (`VITE_*` é público) nem no git; `.env` e dados reais fora do repositório.
- Validação no servidor (Zod/Bean Validation), consultas parametrizadas, sem `dangerouslySetInnerHTML`.
- Falha nunca é silenciosa: sem catch vazio, sem promise solta; erro aparece ao usuário e vai para o log (sem valores nem dados pessoais).
- Interface honesta: nenhum status, selo ou dado fictício.
- WhatsApp só pela Cloud API oficial da Meta.

## Visual
- Zero emojis na UI; ícones Lucide 1,5px (16/20/24).
- Sem neon, glow, sombra colorida, glassmorphism ou gradiente decorativo.
- Amarelo é o único destaque: ação primária, foco, seleção, dado principal.
- Raios: 4 (badge), 8 (botão/input/chip), 12 (card); pílula só em avatar e status.
- Elevação por superfície + borda de 1px. Grade de 4px; margem lateral de 16px no mobile.
- Valores com `tabular-nums`; formatação monetária e de data só pelos utilitários centrais (pt-BR, "R$ 4,2 mil").
- Movimento de 150–200ms ease-out, só como feedback; respeitar `prefers-reduced-motion`.
- Toda tela com estados carregando/vazio/erro/sem conexão. Contraste AA, alvo ≥ 44px, foco visível.
- Nenhuma cor hardcoded em componente: só tokens.

## Comandos
(preencher na Fase 1: dev, test, lint, typecheck, build)
```

## 7. Plano das próximas fases

| Fase | Conteúdo | Tamanho | Principais riscos |
|---|---|---|---|
| 1 · Correções críticas e design system | Contenção imediata no app atual (ver abaixo); tokens; componentes base com estados; rota `/design-system`; protótipo do Início em 390/1280px nas 3 opções de amarelo; IA para aprovação; ADRs de stack, fonte e biblioteca de componentes. | G | Escopo do design system crescer demais (mitigação: só os componentes que o Início usa + base). |
| 2 · Núcleo financeiro | Decisão de back-end; esquema e migrações; auth/autorização com testes de isolamento; domínio (saldo, transferência, cartão/fatura/parcelas, ciclo, recorrência, idempotência, soft delete); script de migração com relatório. | G | Decisão Java × TS atrasar; regras de cartão/parcelas são a parte mais sutil; migração com casos ambíguos. |
| 3 · Início e Transações | Shell mobile/desktop, PWA, Início completo, Transações, registro rápido, modo privacidade, onboarding. | G | Rosca "para onde foi a renda" depende de recorrências e previsões corretas. |
| 4 · Compromissos fixos e caixinhas | 7.4 e 7.6, detecção de assinaturas, migração das metas. | M | Falsos positivos na detecção. |
| 5 · Revisão do mês e exportação | 7.5, normalização de estabelecimentos, regras, alertas, XLSX/CSV. | G | Normalização de descrições é heurística; precisa de dados reais variados. |
| 6 · Registro por mensagem | Parser pt-BR + conjunto golden (150+ frases) → chat no app → WhatsApp (vínculo, webhook, fila, custos). | G | Aprovação da Meta e verificação do negócio (prazo externo); custos por mensagem; termos para bots. **Inicie o cadastro da conta Meta Business e o número dedicado já** — eu listo os passos na Fase 1. |
| 7 · Carteira | Cálculos com testes antes da tela; CDI/Selic via SGS do Bacen; provedor de cotações atrás de interface. | G | Termos e limites dos provedores de cotação; calendário de dias úteis; tributação versionada. |
| 8 · Prontidão para o beta | LGPD completa, monitoramento, backup testado, deploy de produção, convite, métricas. | M | Política de privacidade exige revisão humana; incidentes no beta com dados reais. |

**Contenção proposta para o início da Fase 1** (pequena, no app atual, enquanto a reescrita não chega): adicionar `finbot-data.json` ao `.gitignore`; fazer a API escutar só em `127.0.0.1`; fazer o servidor falhar alto quando a porta estiver ocupada; backup do arquivo antes de cada escrita. Sem isso, os dados atuais continuam expostos na rede local e sujeitos a perda total (C-05, C-06).

## 8. Decisões que preciso de você

1. Autorizar a remoção das entradas de teste gravadas por engano (D6).
2. Back-end: Java 21 + Spring Boot (recomendado) ou TypeScript.
3. Perfis: workspaces (recomendado), remover ou manter.
4. Painel-first: confirma?
5. Onde versionar o briefing e as referências (D1) e se o `MVP_SPECIFICATION.md` vira histórico (D5).
6. Migração: o que é a conta "Itaú" do tipo crédito com saldo inicial positivo; de qual conta sai o valor já guardado nas metas.
7. Aprovar o `CLAUDE.md` da seção 6 e a contenção da seção 7.
