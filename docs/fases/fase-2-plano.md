# Fase 2 — Plano: núcleo financeiro

> Status: **aguardando aprovação** · Branch: `fase-2-nucleo-financeiro` · Tamanho: **G**
> Referências: briefing §9, §12, §13 e §14 · `docs/diagnostico.md` §4 e §5 · ADRs 0001–0008.
> Preços e limites consultados em 20/10/2026 nas páginas oficiais (fontes no fim). Confira antes de assinar qualquer plano.

## Objetivo

Colocar no ar uma API em Java 21 + Spring Boot com o domínio financeiro correto e testado: contas, transações, transferências, cartão com fatura e parcelas, ciclo mensal, recorrências e caixinhas. A API terá autenticação real e isolamento por workspace, guardará os dados em Postgres gerenciado com migrações, e o front na Vercel conseguirá alcançá-la. As telas só passam a usar dados reais na Fase 3; nesta fase, o front prova a conexão com um teste de saúde.

## Escopo

1. **ADRs 0009–0012:** hospedagem da API, banco, autenticação e sessão, comunicação front ↔ API (decisões resumidas abaixo).
2. **`api/` em Spring Boot 4.1** (versão estável vigente), Java 21, Maven Wrapper, Spring Web, Spring Security, Spring Data JPA, Flyway, Bean Validation, springdoc-openapi.
3. **Esquema e migrações (Flyway)** a partir do diagnóstico §5.1, com `workspace_id` em toda entidade (ADR 0002). Dinheiro em `BIGINT` (centavos); datas de transação em `DATE`; timestamps em `timestamptz`.
4. **Domínio com testes primeiro**, seguindo as regras do briefing §9.1:
   - saldo sempre derivado (saldo inicial + movimentos), sem campo editável;
   - transferência como tipo próprio (caixinha, investimento, pagamento de fatura), que nunca entra em receita ou despesa;
   - cartão: compra na data da compra, fatura calculada por fechamento e vencimento, pagamento como transferência;
   - parcelamento em N lançamentos ligados por grupo, com regra de arredondamento documentada e testada (o centavo que sobra vai para a 1ª parcela);
   - ciclo mensal com dia de início configurável e virada de mês no fuso do usuário;
   - recorrências (cadastro e previsão; a conciliação com transações reais fica na Fase 4);
   - caixinhas (meta, prazo e aporte planejado; aporte e resgate são transferências);
   - origem e chave de idempotência únicas por workspace; exclusão lógica (`deleted_at`).
5. **Autenticação** (ADR 0011):
   - cadastro por convite (beta fechado), e-mail e senha com hash Argon2id;
   - sessão em cookie `httpOnly`, `Secure`, `SameSite=Lax`, guardada no Postgres (Spring Session JDBC);
   - proteção CSRF;
   - limite de tentativas e bloqueio progressivo no login;
   - listar e revogar sessões;
   - recuperação de senha completa, com o envio de e-mail atrás de uma interface: em desenvolvimento a mensagem vai para o log; o provedor real entra na Fase 8 (ver "Contas");
   - estrutura pronta para 2FA (TOTP) e passkeys, sem implementar.
6. **Autorização:** toda consulta filtrada pelo workspace do usuário. Uma suíte de isolamento cria os usuários A e B e prova, para **cada endpoint**, que A não lê, altera nem apaga dados de B.
7. **API REST documentada em OpenAPI**, com tipos TypeScript gerados para `web/src/api/` (o uso nas telas fica para a Fase 3).
8. **Infraestrutura:**
   - Dockerfile multi-stage (JRE 21, usuário sem privilégios);
   - `fly.toml` na região São Paulo (`gru`);
   - projeto Neon em São Paulo (`aws-sa-east-1`);
   - proxy da Vercel com segredo de origem e cache desligado;
   - CSP no front.
9. **CI e cadeia de suprimentos** (inclui as correções da revisão de segurança do commit `4320c32`):
   - job `api` rodando `./mvnw verify` com Testcontainers (Postgres real) e JaCoCo exigindo ≥ 90% de cobertura no domínio;
   - actions fixadas por SHA de commit;
   - gitleaks sem permissão de escrita em PRs;
   - Dependabot para npm, Maven e GitHub Actions;
   - deploy automático em homologação a cada merge na `main`.
10. **Logs** estruturados em JSON, sem dados pessoais nem valores. O Sentry fica para a Fase 8.
11. **`audit_log`** gravando login, logout, falhas de login, troca de senha e revogação de sessão.

## Fora de escopo

- Telas consumindo a API, remoção do `legacy/` e os ajustes visuais pedidos (Fase 3).
- Remoção das cores Quente e Lima: junto com os ajustes visuais, no início da Fase 3.
- Conciliação e detecção de assinaturas (Fase 4).
- Motor de regras de classificação, normalização de estabelecimentos e exportação (Fase 5). As tabelas `merchants`, `merchant_aliases` e `classification_rules` já são criadas agora, vazias, para o esquema não mudar depois.
- Mensagens e WhatsApp (Fase 6). Investimentos (Fase 7).
- E-mail real, domínio próprio, Sentry, política de privacidade, exportação e exclusão de conta (Fase 8).
- Migração de dados antigos (você confirmou que eram só de teste).

## Contas que você precisa criar

| Serviço | Para quê | Plano agora | Custo | Quando começa a cobrar |
|---|---|---|---|---|
| **Neon** (Postgres) | Banco, região São Paulo | Free | US$ 0. Limites: 1 GB por projeto, 100 CU-hora por mês, compute dorme após 5 min sem uso (não dá para desligar no Free), histórico de restauração de 6 h, sem snapshots agendados. | **Antes do beta (Fase 8)** recomendo o **Launch**, pago por uso e sem mínimo mensal: compute US$ 0,106/CU-hora, armazenamento US$ 0,35/GB-mês, restauração de até 7 dias (US$ 0,20/GB-mês) e snapshots agendados (US$ 0,09/GB-mês). É o que atende "backup diário com teste de restauração". Minha estimativa para 10 a 50 usuários, com o banco dormindo quando ocioso, é de US$ 1 a 5 por mês; o número real sai do painel de uso. |
| **Fly.io** (API) | Rodar a API Java em São Paulo (`gru`) | Sem plano gratuito para contas novas. O teste grátis dura até 2 h de máquina ou 7 dias e **exige cartão**. | **Homologação** (Fase 2): máquina que liga sob demanda e desliga ociosa. Você paga só o tempo ligada, mais US$ 0,15/GB-mês do disco da imagem enquanto parada; na prática, centavos por mês. **Produção**: shared-cpu-1x com 1 GB sempre ligada, cerca de **US$ 10,82/mês** em São Paulo (calculado pela tabela da Fly: US$ 6,70 em Virginia × 1,62 de acréscimo regional). | Produção só quando o front passar a usar a API de verdade (Fase 3) ou no beta, à sua escolha. |
| **Vercel** (front) | Já existe | Hobby | US$ 0 | O Hobby é **só para uso pessoal, não comercial**. O beta fechado e gratuito com amigos e família cabe nele. Ao comercializar (cobrar, anunciar venda), é obrigatório o Pro: **US$ 20 por usuário/mês**. |
| **GitHub** | Repositório, CI, segredos | Free | US$ 0 | Repositório público: minutos de Actions sem custo. |
| Resend + domínio próprio (**só na Fase 8**) | E-mail de recuperação de senha e convites | Free: 3.000 e-mails/mês, 100/dia, 3 domínios | US$ 0. O Pro custa US$ 20/mês, para 50.000 e-mails. Exige domínio próprio verificado; o preço de um `.com.br` está no site do Registro.br. | Não antes da Fase 8. |

**Custo da Fase 2:** perto de US$ 0 (Neon Free + Fly homologação ligando sob demanda), mas a Fly exige cartão de crédito cadastrado.
**Custo estimado do beta (Fase 8):** cerca de US$ 12 a 16 por mês (Fly produção ≈ US$ 10,82 + Neon Launch ≈ US$ 1 a 5), com Vercel, GitHub e Resend gratuitos.

### Alternativas avaliadas para a API

| Opção | Região no Brasil | Gratuito | Por que não é a recomendação |
|---|---|---|---|
| **Fly.io** (recomendada) | Sim (`gru`) | Não | Recomendada: mesma cidade do banco, processo sempre ligado para o webhook do WhatsApp (Fase 6) e tarefas agendadas. |
| Google Cloud Run | Sim (`southamerica-east1`) | Sim: a página de preços cita 240 mil vCPU-segundos e 450 mil GiB-segundos por mês (conferir antes) | Escala até zero: uma API Spring parada leva segundos para subir, o que é ruim para o webhook da Meta. A configuração (projeto GCP, faturamento, Artifact Registry) também dá mais trabalho. É a alternativa se custo zero for prioridade. |
| Render | Não (EUA, Frankfurt, Singapura) | Sim, mas dorme após 15 min e leva cerca de 1 min para acordar | Fica longe do banco em São Paulo, e cada consulta pagaria a latência. O Starter (cerca de US$ 7, 512 MB, segundo fontes secundárias) é apertado para a JVM. |
| Railway | Não (EUA, Amsterdã, Singapura) | US$ 1/mês de crédito no Free | Mesmo problema de distância do banco. |

### Alternativa avaliada para o banco

O **Supabase Free** tem 500 MB, pausa o projeto após 1 semana sem uso e não faz backup automático; o Pro custa US$ 25/mês. A Neon é mais barata na escala do beta e tem restauração por janela de tempo no Launch.

## Como o front na Vercel fala com a API fora dela

```
 Navegador ──HTTPS──► finbot-ochre.vercel.app ──────────────► Fly.io (gru) ──► Neon (sa-east-1)
                      │  /            → app React (estático)   API Spring       Postgres
                      │  /api/*       → proxy (rewrite externo) + cabeçalho
                      │                 x-origin-secret
                      └─ mesma origem para o navegador: sem CORS, cookie first-party
```

- **Domínios:** o navegador só conhece `finbot-ochre.vercel.app`. A Vercel encaminha `/api/*` para `finbot-api.fly.dev` usando o recurso oficial de rewrite para origem externa. **Não é preciso domínio próprio nesta fase.**
- **CORS:** desnecessário, porque para o navegador tudo é a mesma origem. A API **não habilita CORS** e recusa qualquer requisição que não traga o cabeçalho secreto que a Vercel injeta (`x-origin-secret`, comparado em tempo constante), como a própria documentação da Vercel recomenda. Quem tentar chamar o `fly.dev` direto recebe 403.
- **Autenticação:** cookie de sessão `httpOnly`, `Secure`, `SameSite=Lax`, emitido pela API e visto pelo navegador como cookie do próprio site.
  - Isso evita o problema que existiria com a API num domínio separado: o Safari do iPhone bloqueia cookies de terceiros. Com o proxy, o login funciona no iPhone sem truques.
  - Sem JWT no `localStorage`.
  - CSRF com token em cookie legível e cabeçalho `X-XSRF-TOKEN` (padrão do Spring Security).
- **Cache:** projetos Vercel criados depois de 06/04/2026, que é o caso do seu, respeitam por padrão os cabeçalhos de cache das respostas vindas da origem externa. Para dado financeiro isso é um risco. Duas travas:
  - a API responde `Cache-Control: no-store` em tudo;
  - o `vercel.json` desliga o cache de `/api/*` com `x-vercel-enable-rewrite-caching: 0`.
  
  Um teste E2E verifica os dois.
- **Ambientes:**
  - desenvolvimento local: Postgres em Docker e Vite com proxy para a API local;
  - **homologação:** deploys de preview da Vercel → API de homologação na Fly → branch `staging` da Neon;
  - **produção:** domínio de produção da Vercel → API de produção → branch `main` da Neon.
  
  A escolha do destino é feita no `vercel.json` pela regra de host. Segredos distintos por ambiente, bancos separados (briefing §13).
- **Cabeçalhos de segurança:**
  - HSTS: a Vercel já envia (conferido no deploy);
  - a CSP passa a ter `connect-src 'self'` (a API está na mesma origem) e `frame-ancestors 'none'`.
- **Custo do proxy:** o Hobby inclui 10 GB/mês de *Fast Origin Transfer*, folga grande para JSON de 10 a 50 usuários.
- **Ponto a validar logo no início:** confirmar que os cabeçalhos `Set-Cookie` e o cookie de CSRF passam pelo rewrite intactos. Se não passarem, o plano B é um domínio próprio com `app.` e `api.` no mesmo site (cookie `SameSite=Lax` continua funcionando, inclusive no iPhone), o que antecipa a compra do domínio.

## Variáveis de ambiente

| Onde | Nome | Conteúdo | Segredo |
|---|---|---|---|
| Fly (por app) | `SPRING_PROFILES_ACTIVE` | `staging` ou `prod` | Não |
| Fly | `SPRING_DATASOURCE_URL` | URL JDBC da Neon (com `sslmode=require`) | Sim |
| Fly | `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` | Papel da aplicação na Neon, sem permissão de DDL | Sim |
| Fly | `FLYWAY_URL` / `FLYWAY_USER` / `FLYWAY_PASSWORD` | Papel separado só para migrações | Sim |
| Fly | `FINBOT_ORIGIN_SECRET` | Valor aleatório de 32 bytes; o mesmo do ambiente correspondente na Vercel | Sim |
| Vercel (Production e Preview, valores distintos) | `ORIGIN_SECRET` | Igual ao `FINBOT_ORIGIN_SECRET` da API do ambiente | Sim |
| GitHub Actions | `FLY_API_TOKEN` | Token de deploy restrito ao app de homologação | Sim |
| Local | `api/.env.example` versionado; `.env` real fora do git | Valores de desenvolvimento | — |

Nenhuma variável `VITE_*` carrega segredo; o front não precisa de nenhuma nesta fase.

## Módulos e arquivos afetados

- `api/` (novo):
  - pacotes por contexto: `identity` (usuários, convites, sessões, workspaces), `ledger` (contas, transações, transferências, saldos), `cards` (faturas e parcelas), `planning` (recorrências, caixinhas), `catalog` (categorias, estabelecimentos, regras), `audit`;
  - `src/main/resources/db/migration`;
  - `Dockerfile`, `fly.toml`.
- `web/vercel.json` (proxy, cache, CSP), `web/src/api/` (tipos gerados), `web/vite.config.ts` (proxy local).
- `.github/workflows/ci.yml` (job `api`, SHAs, deploy de homologação), `.github/dependabot.yml`.
- `docs/adr/0009`–`0012`, `docs/fases/fase-2.md`, `README.md`, `CLAUDE.md` (comandos da API).

## Modelo de dados (resumo; o DDL final vai nas migrações)

`users`, `invites`, `workspaces`, `workspace_members`, `spring_session*`, `accounts` (com `closing_day` e `due_day` para cartão), `categories` (com as categorias padrão do briefing §9.2), `transactions` (com `kind`, `amount_cents > 0`, `occurred_on`, `counter_account_id`, `installment_group_id`, `installment_no/total`, `source`, `idempotency_key`, `review_status`, `deleted_at`), `installment_groups`, `recurrences`, `savings_boxes`, `merchants`, `merchant_aliases`, `classification_rules`, `audit_log`.

Restrições no próprio banco, além dos testes:
- `CHECK (amount_cents > 0)`;
- `UNIQUE (workspace_id, source, idempotency_key)`;
- chaves estrangeiras compostas com `workspace_id`, para que uma transação não aponte para a conta de outro workspace;
- transferência exige conta de destino diferente da de origem.

## Riscos

| Risco | Mitigação |
|---|---|
| Regras de cartão e parcelas são as mais sutis | Exemplos conferidos à mão viram testes antes do código; virada de mês e fechamento no último dia do mês têm casos dedicados. |
| Cookies não atravessarem o proxy da Vercel como esperado | Validado no primeiro dia com um endpoint de teste; plano B com domínio próprio descrito acima. |
| Compute da Neon dormindo deixa a primeira requisição lenta | Aceitável em homologação; no Launch, o tempo para dormir é configurável. Medir e registrar no relatório. |
| Spring Boot apertado em 1 GB | Ajuste de JVM (`MaxRAMPercentage`), medição de memória no relatório. GraalVM native fica como opção futura, não nesta fase. |
| Docker parado na sua máquina | Os testes de integração usam Testcontainers: o Docker Desktop precisa estar aberto para rodá-los localmente. O CI roda independente disso. |
| Escopo grande (G) | Entrega em PRs menores dentro da fase: (1) esqueleto + infra + proxy; (2) identidade e isolamento; (3) contas, transações e transferências; (4) cartão e parcelas; (5) recorrências e caixinhas. |

## Estratégia de testes

- **Unitários do domínio** (JUnit 5 + AssertJ), sem banco: saldo, transferências fora de receita e despesa, fatura por ciclo, parcelas e arredondamento, ciclo customizado, fuso na virada do mês e do ano, idempotência. Meta: **≥ 90% de cobertura no domínio**, travada no CI pelo JaCoCo.
- **Integração** com Postgres real (Testcontainers): migrações do zero, restrições do banco e repositórios.
- **Isolamento**: suíte parametrizada que percorre todos os endpoints com os usuários A e B.
- **Segurança**: login com bloqueio progressivo, CSRF, requisição sem segredo de origem → 403, `Cache-Control: no-store` em todas as respostas.
- **Contrato**: o OpenAPI gerado é comparado com o versionado; mudança não intencional quebra o CI.
- **E2E**: o preview da Vercel chama `/api/health` através do proxy e confere status, ausência de cache e segredo não exposto.

## Critérios de aceite

- [ ] ADRs 0009–0012 escritos, com fontes.
- [ ] `./mvnw verify` verde no CI, com cobertura do domínio ≥ 90%.
- [ ] Suíte de isolamento cobrindo 100% dos endpoints, verde.
- [ ] Testes nomeados para cada regra do briefing §9.1 (lista no relatório).
- [ ] API de homologação no ar na Fly (`gru`), acessível só pelo proxy da Vercel; acesso direto responde 403.
- [ ] Login, logout, recuperação de senha (e-mail no log) e revogação de sessão funcionando pelo proxy, inclusive no Safari do iPhone.
- [ ] Nenhuma resposta da API é cacheada pela Vercel (teste automatizado).
- [ ] Actions fixadas por SHA, Dependabot ativo, gitleaks sem escrita em PR.
- [ ] Relatório `docs/fases/fase-2.md` com como testar, custos reais do mês e pendências.

## Decisões que preciso de você

1. **Hospedagem:** Fly.io em São Paulo + Neon São Paulo (recomendado), ou Cloud Run + Neon para custo zero, aceitando a partida lenta da API parada.
2. **Cadastro só por convite** durante o beta (recomendado), ou aberto.
3. **Quando ligar a produção** (cerca de US$ 10,82/mês na Fly): no início da Fase 3, quando o front passar a usar a API (recomendado, para você testar no celular com dados reais seus), ou só no beta (Fase 8).

Antes de eu começar, você precisa criar as contas **Neon** e **Fly.io** (esta com cartão) e me avisar. Eu passo os comandos de configuração no primeiro PR, e nenhum segredo vai para o repositório nem para esta conversa: você os cola direto nos painéis da Fly, da Vercel e do GitHub.

## Fontes

- Neon, preços e regiões: https://neon.com/pricing · https://neon.com/docs/introduction/regions
- Supabase, preços: https://supabase.com/pricing
- Fly.io, preços: https://docs.fly.io/about/pricing
- Render, plano gratuito e regiões: https://render.com/docs/free · https://render.com/docs/regions (preço do Starter apenas em fontes secundárias, p. ex. https://livemy.app/blog/render-pricing)
- Railway, preços e regiões: https://railway.com/pricing · https://docs.railway.com/reference/deployment-regions
- Google Cloud Run, preços: https://cloud.google.com/run/pricing
- Vercel, rewrites externos, segredo de origem e cache: https://vercel.com/docs/routing/rewrites
- Vercel, Hobby, uso comercial e limites: https://vercel.com/docs/plans/hobby · https://vercel.com/docs/limits/fair-use-guidelines
- Resend, preços: https://resend.com/pricing
