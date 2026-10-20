# Fase 2 — Plano: núcleo financeiro

> Status: **revisado para custo zero (opção B, escolhida em 20/10/2026); aguardando aprovação para implementar** · Branch: `fase-2-nucleo-financeiro` · Tamanho: **G**
> Referências: briefing §1 (atualização de 20/10/2026: orçamento zero), §9, §12, §13 e §14 · `docs/diagnostico.md` §4 e §5 · ADRs 0001–0008.
> Limites dos planos gratuitos consultados em 20/10/2026 nas páginas oficiais (fontes no fim).

## Objetivo

Construir uma API em Java 21 + Spring Boot com o domínio financeiro correto e testado: contas, transações, transferências, cartão com fatura e parcelas, ciclo mensal, recorrências e caixinhas. A API terá autenticação real e isolamento por workspace, e guardará os dados em Postgres com migrações. Ela fica no ar **sem nenhum custo**, para uso pessoal, atrás do front na Vercel. As telas só passam a usar dados reais na Fase 3; nesta fase, o front prova a conexão com um teste de saúde.

## Regra de custo

Só serviços **gratuitos que não pedem cartão**. Sem cartão cadastrado, nenhum serviço consegue cobrar: ao estourar um limite, o serviço é suspenso até o mês seguinte, e não há fatura. Toda escolha abaixo segue essa regra; o que exigiria plano pago foi trocado por uma alternativa gratuita.

## Escopo

1. **ADRs 0009–0012:**
   - 0009: hospedagem com custo zero (Render Free + Neon Free);
   - 0010: banco e migrações;
   - 0011: autenticação e sessão;
   - 0012: comunicação front ↔ API.
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
   - cadastro **fechado, só por convite**: a URL é pública, e sem isso qualquer pessoa poderia criar conta e consumir a cota gratuita. O primeiro convite sai por um comando de linha na própria API;
   - e-mail e senha com hash Argon2id;
   - sessão em cookie `httpOnly`, `Secure`, `SameSite=Lax`, guardada no Postgres (Spring Session JDBC). Fica no banco porque o Render reinicia a máquina gratuita quando quer, e uma sessão em memória se perderia;
   - proteção CSRF;
   - limite de tentativas e bloqueio progressivo no login;
   - listar e revogar sessões;
   - recuperação de senha completa, com o envio de e-mail atrás de uma interface. Até a Fase 8, a mensagem vai para o log. O plano gratuito do Render bloqueia as portas de SMTP, então o provedor futuro terá de ser um serviço de e-mail por HTTPS;
   - estrutura pronta para 2FA (TOTP) e passkeys, sem implementar.
6. **Autorização:** toda consulta filtrada pelo workspace do usuário. Uma suíte de isolamento cria os usuários A e B e prova, para **cada endpoint**, que A não lê, altera nem apaga dados de B.
7. **Exportação dos dados** (`GET /api/export`, JSON do workspace inteiro): é o backup do uso pessoal, no lugar do backup diário pago. O botão na tela entra na Fase 3.
8. **API REST documentada em OpenAPI**, com tipos TypeScript gerados para `web/src/api/` (o uso nas telas fica para a Fase 3).
9. **Infraestrutura:**
   - Dockerfile multi-stage (JRE 21, usuário sem privilégios), ajustado para caber em 512 MB;
   - `render.yaml` (Blueprint) com o serviço web gratuito na região Virginia;
   - projeto Neon Free na região `aws-us-east-1`, a mesma área do Render, para a API não pagar latência a cada consulta;
   - proxy da Vercel com segredo de origem e cache desligado;
   - CSP no front;
   - Postgres local via `docker compose` para desenvolvimento.
10. **CI e cadeia de suprimentos** (inclui as correções da revisão de segurança do commit `4320c32`):
    - job `api` rodando `./mvnw verify` com Testcontainers (Postgres real) e JaCoCo exigindo ≥ 90% de cobertura no domínio;
    - actions fixadas por SHA de commit;
    - gitleaks sem permissão de escrita em PRs;
    - Dependabot para npm, Maven e GitHub Actions;
    - deploy automático no Render só depois do CI verde na `main`.
11. **Logs** estruturados em JSON, sem dados pessoais nem valores. O Sentry fica para a Fase 8, se houver plano gratuito sem cartão.
12. **`audit_log`** gravando login, logout, falhas de login, troca de senha e revogação de sessão.

## Fora de escopo

- Telas consumindo a API, remoção do `legacy/` e os ajustes visuais pedidos (Fase 3).
- Remoção das cores Quente e Lima: junto com os ajustes visuais, no início da Fase 3.
- Conciliação e detecção de assinaturas (Fase 4).
- Motor de regras de classificação e normalização de estabelecimentos (Fase 5). As tabelas `merchants`, `merchant_aliases` e `classification_rules` já são criadas agora, vazias, para o esquema não mudar depois.
- Mensagens e WhatsApp (Fase 6). Investimentos (Fase 7).
- E-mail real, domínio próprio, Sentry, política de privacidade e exclusão de conta (Fase 8).
- Migração de dados antigos (você confirmou que eram só de teste).

## Contas que você precisa criar (todas sem cartão)

| Serviço | Para quê | Plano | Limites relevantes | O que acontece no limite |
|---|---|---|---|---|
| **Render** | Rodar a API Java | Free | 512 MB de RAM e 0,1 de CPU. Dorme após **15 min sem tráfego** e leva **cerca de 1 min para acordar**. 750 horas de instância por mês por workspace, que bastam para um serviço ligado o mês inteiro (744 h). Uma instância só, sem disco persistente. Pode reiniciar a qualquer momento. Portas de SMTP (25, 465, 587) bloqueadas. A documentação diz que o plano não é para produção; uso pessoal e portfólio estão dentro disso. | Sem forma de pagamento cadastrada, estourar a banda de saída **suspende** o serviço até o mês seguinte, sem cobrança. Estourar os minutos de build só impede novos deploys. |
| **Neon** | Banco Postgres | Free (permanente, não é teste) | 1 GB por projeto e 100 CU-hora de compute por mês. O compute dorme após 5 min sem uso. Histórico de restauração de 6 h. Não pede cartão. | O banco para até o mês seguinte. Para uso pessoal, o consumo fica muito abaixo do limite. |
| **Vercel** | Front | Hobby (já existe) | Uso pessoal e não comercial, que é o caso agora. 10 GB por mês de tráfego para a origem externa. | — |
| **GitHub** | Repositório e CI | Free | Repositório público: minutos de Actions sem custo. | — |

**Custo: US$ 0**, sem cartão em nenhum serviço.

O **Postgres gratuito do próprio Render não serve**: ele expira 30 dias depois de criado e é apagado após mais 14 dias. Por isso o banco fica na Neon.

### Concessões do custo zero

| Concessão | Consequência | Como fica aceitável |
|---|---|---|
| A API dorme após 15 min | A primeira abertura depois disso leva cerca de 1 min | O proxy da Vercel espera até 120 s pela resposta, mais que o tempo para acordar. O front mostra "Conectando ao servidor…" com nova tentativa automática, em vez de erro. |
| Servidor nos EUA (Virginia) | Cerca de 120–150 ms a mais por requisição vindo do Brasil | Banco e API na mesma região; numa tela de finanças a diferença é imperceptível. |
| Sem backup diário (briefing §13) | A restauração da Neon cobre só as últimas 6 h | Exportação JSON pelo próprio app (item 7). O briefing foi atualizado para registrar a troca. |
| Spring Boot em 0,1 de CPU e 512 MB | Partida lenta e memória apertada | Medido no primeiro PR (ver Riscos). |
| Um ambiente só online | Sem homologação separada na nuvem | Homologação é a máquina local com `docker compose`. O ambiente online é o seu, de uso pessoal, e só recebe deploy com CI verde. Os previews da Vercel não recebem o segredo de origem, então não alcançam a API nem seus dados. |

### Alternativas avaliadas

| Opção | Por que não |
|---|---|
| Fly.io + Neon Launch | Recomendação anterior. Exige cartão e custaria cerca de US$ 12 a 16 por mês. Fora da regra de custo. |
| Google Cloud Run | Tem cota gratuita, mas exige conta de faturamento com cartão. |
| Railway | O Free dá só US$ 1 por mês de crédito, pouco para uma JVM. |
| Supabase Free (banco) | 500 MB e pausa o projeto após 1 semana sem uso. A Neon só suspende o compute e acorda sozinha. |
| Render Postgres Free | Expira em 30 dias. |

## Como o front na Vercel fala com a API

```
 Navegador ──HTTPS──► finbot-ochre.vercel.app ──────────────► Render (Virginia) ──► Neon (us-east-1)
                      │  /            → app React (estático)   API Spring           Postgres
                      │  /api/*       → proxy (rewrite externo) + cabeçalho
                      │                 x-origin-secret
                      └─ mesma origem para o navegador: sem CORS, cookie first-party
```

- **Domínios:** o navegador só conhece `finbot-ochre.vercel.app`. A Vercel encaminha `/api/*` para o endereço `onrender.com` da API usando o recurso oficial de rewrite para origem externa. **Não é preciso domínio próprio.**
- **CORS:** desnecessário, porque para o navegador tudo é a mesma origem. A API **não habilita CORS** e recusa qualquer requisição que não traga o cabeçalho secreto que a Vercel injeta (`x-origin-secret`, comparado em tempo constante), como a própria documentação da Vercel recomenda. Quem chamar o `onrender.com` direto recebe 403. O único caminho liberado sem o segredo é `GET /health`, que não devolve dado nenhum.
- **Autenticação:** cookie de sessão `httpOnly`, `Secure`, `SameSite=Lax`, emitido pela API e visto pelo navegador como cookie do próprio site.
  - Isso evita o problema que existiria com a API num domínio separado: o Safari do iPhone bloqueia cookies de terceiros. Com o proxy, o login funciona no iPhone sem truques.
  - Sem JWT no `localStorage`.
  - CSRF com token em cookie legível e cabeçalho `X-XSRF-TOKEN` (padrão do Spring Security).
- **Cache:** projetos Vercel criados a partir de 06/04/2026, que é o caso do seu, respeitam por padrão os cabeçalhos de cache das respostas vindas da origem externa. Para dado financeiro isso é um risco. Duas travas:
  - a API responde `Cache-Control: no-store` em tudo;
  - o `vercel.json` desliga o cache de `/api/*` com `x-vercel-enable-rewrite-caching: 0`.

  Um teste E2E verifica os dois.
- **Ambientes:**
  - desenvolvimento e homologação: Postgres em `docker compose` e Vite com proxy para a API local;
  - **online (uso pessoal):** domínio de produção da Vercel → API no Render → Neon;
  - previews da Vercel: sem o segredo de origem, recebem 403 da API.
- **Cabeçalhos de segurança:**
  - HSTS: a Vercel já envia (conferido no deploy);
  - a CSP passa a ter `connect-src 'self'` (a API está na mesma origem) e `frame-ancestors 'none'`.
- **Ponto a validar logo no início:** confirmar que os cabeçalhos `Set-Cookie` e o cookie de CSRF passam pelo rewrite intactos. Se não passarem, o plano B continua gratuito: uma Vercel Function no próprio projeto faz o papel do proxy e repassa os cookies. Isso fica registrado num ADR antes de ser feito.

## Variáveis de ambiente

| Onde | Nome | Conteúdo | Segredo |
|---|---|---|---|
| Render | `SPRING_PROFILES_ACTIVE` | `prod` | Não |
| Render | `SPRING_DATASOURCE_URL` | URL JDBC da Neon (com `sslmode=require`) | Sim |
| Render | `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` | Papel da aplicação na Neon, sem permissão de DDL | Sim |
| Render | `FLYWAY_URL` / `FLYWAY_USER` / `FLYWAY_PASSWORD` | Papel separado só para migrações | Sim |
| Render | `FINBOT_ORIGIN_SECRET` | Valor aleatório de 32 bytes, igual ao da Vercel | Sim |
| Render | `JAVA_TOOL_OPTIONS` | Ajustes de memória da JVM | Não |
| Vercel (só Production) | `ORIGIN_SECRET` | Igual ao `FINBOT_ORIGIN_SECRET` | Sim |
| Local | `api/.env.example` versionado; `.env` real fora do git | Valores de desenvolvimento | — |

Nenhuma variável `VITE_*` carrega segredo; o front não precisa de nenhuma nesta fase. O deploy é disparado pela integração do próprio Render com o GitHub, configurada para esperar o CI passar, sem token guardado no GitHub.

## Módulos e arquivos afetados

- `api/` (novo):
  - pacotes por contexto: `identity` (usuários, convites, sessões, workspaces), `ledger` (contas, transações, transferências, saldos, exportação), `cards` (faturas e parcelas), `planning` (recorrências, caixinhas), `catalog` (categorias, estabelecimentos, regras), `audit`;
  - `src/main/resources/db/migration`;
  - `Dockerfile`, `compose.yaml`.
- `render.yaml` na raiz (Blueprint do Render).
- `web/vercel.json` (proxy, cache, CSP), `web/src/api/` (tipos gerados), `web/vite.config.ts` (proxy local).
- `.github/workflows/ci.yml` (job `api`, SHAs), `.github/dependabot.yml`.
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
| Spring Boot não subir bem em 0,1 de CPU e 512 MB | Medido no primeiro PR, antes do domínio. Ajustes em ordem: limites de memória da JVM, inicialização preguiçosa e cache de classes (CDS/AOT do Java). Se ainda assim passar de 120 s para acordar, a alternativa é compilar a API como imagem nativa (GraalVM), que sobe em menos de 1 s e usa bem menos memória, com build mais demorado (decisão sua, num ADR). Se nada disso couber, a API continua completa no GitHub rodando local (opção A), sem prejuízo para o portfólio. |
| Cookies não atravessarem o proxy da Vercel como esperado | Validado no primeiro PR com um endpoint de teste; plano B gratuito descrito acima. |
| Neon e Render dormindo ao mesmo tempo | Os dois tempos de partida se somam. Medir e registrar no relatório; o aviso "Conectando ao servidor…" cobre a espera. |
| Plano gratuito mudar de regra | Sem cartão, a pior consequência é a API sair do ar, nunca uma cobrança. A exportação JSON preserva os dados. |
| Docker parado na sua máquina | Os testes de integração usam Testcontainers: o Docker Desktop precisa estar aberto para rodá-los localmente. O CI roda independente disso. |
| Escopo grande (G) | Entrega em PRs menores dentro da fase: (1) esqueleto + infra + proxy + medição no Render; (2) identidade e isolamento; (3) contas, transações e transferências; (4) cartão e parcelas; (5) recorrências, caixinhas e exportação. |

## Estratégia de testes

- **Unitários do domínio** (JUnit 5 + AssertJ), sem banco: saldo, transferências fora de receita e despesa, fatura por ciclo, parcelas e arredondamento, ciclo customizado, fuso na virada do mês e do ano, idempotência. Meta: **≥ 90% de cobertura no domínio**, travada no CI pelo JaCoCo.
- **Integração** com Postgres real (Testcontainers): migrações do zero, restrições do banco e repositórios.
- **Isolamento**: suíte parametrizada que percorre todos os endpoints com os usuários A e B.
- **Segurança**: login com bloqueio progressivo, CSRF, requisição sem segredo de origem → 403, `Cache-Control: no-store` em todas as respostas.
- **Contrato**: o OpenAPI gerado é comparado com o versionado; mudança não intencional quebra o CI.
- **Exportação**: o JSON exportado contém todo o workspace e nada de outro workspace.
- **E2E**: o domínio de produção da Vercel chama `/api/health` através do proxy e confere status, ausência de cache e segredo não exposto.

## Critérios de aceite

- [ ] ADRs 0009–0012 escritos, com fontes.
- [ ] `./mvnw verify` verde no CI, com cobertura do domínio ≥ 90%.
- [ ] Suíte de isolamento cobrindo 100% dos endpoints, verde.
- [ ] Testes nomeados para cada regra do briefing §9.1 (lista no relatório).
- [ ] API no ar no Render Free, acessível só pelo proxy da Vercel; acesso direto responde 403.
- [ ] Tempo para acordar e memória usada medidos e registrados no relatório.
- [ ] Login, logout, recuperação de senha (e-mail no log) e revogação de sessão funcionando pelo proxy, inclusive no Safari do iPhone.
- [ ] Nenhuma resposta da API é cacheada pela Vercel (teste automatizado).
- [ ] Actions fixadas por SHA, Dependabot ativo, gitleaks sem escrita em PR.
- [ ] Nenhum serviço com cartão cadastrado; custo do mês: US$ 0.
- [ ] Relatório `docs/fases/fase-2.md` com como testar e pendências.

## Decisões

Já tomada por você em 20/10/2026: **opção B**, com a API completa no GitHub e uma versão online gratuita para uso pessoal.

Para confirmar na aprovação (minha recomendação entre parênteses):
1. **Cadastro fechado, só por convite** (recomendo, porque a URL é pública).
2. **O ambiente online só guarda dados reais a partir da Fase 3**, quando o front passar a usar a API (recomendo). Até lá, só dados de teste.

## Antes do primeiro PR

Crie duas contas, **sem cadastrar cartão**:
- **Neon:** um projeto na região AWS US East (N. Virginia).
- **Render:** conta com login pelo GitHub.

O passo a passo de configuração vem no primeiro PR. Nenhum segredo vai para o repositório nem para a conversa: você os cola direto nos painéis do Render e da Vercel.

## Fontes

- Render, plano gratuito (partida, 750 h, suspensão sem forma de pagamento, Postgres de 30 dias, SMTP bloqueado): https://render.com/docs/free
- Render, especificação da instância gratuita (512 MB, 0,1 CPU): https://render.com/pricing
- Render, regiões: https://render.com/docs/regions
- Neon, plano gratuito (1 GB, 100 CU-hora, 5 min, 6 h, sem cartão): https://neon.com/pricing
- Neon, regiões: https://neon.com/docs/introduction/regions
- Vercel, rewrites externos, segredo de origem e cache: https://vercel.com/docs/routing/rewrites
- Vercel, tempo limite do proxy (120 s): https://vercel.com/docs/limits#proxied-request-timeout
- Vercel, Hobby e uso não comercial: https://vercel.com/docs/plans/hobby
- Supabase, preços: https://supabase.com/pricing
- Railway, preços: https://railway.com/pricing
- Fly.io, preços: https://docs.fly.io/about/pricing
- Google Cloud Run, preços: https://cloud.google.com/run/pricing
