> **Documento histórico (arquivado em 19/10/2026).** Descreve a visão original chat-first do MVP. Foi substituído por `docs/briefing-finbot.md`, que prevalece em qualquer conflito (ver ADR 0003).

# FinBot — Especificação MVP
## Aplicativo de Finanças Pessoais Conversacional com IA

> **Versão:** 1.0-MVP  
> **Data:** Junho 2026  
> **Classificação:** Documento Interno — Product & Engineering

---

## Sumário Executivo

O **FinBot** é um gerenciador financeiro pessoal baseado em interface conversacional (Chat UI). Seu diferencial estratégico é eliminar o atrito de onboarding causado por formulários e planilhas complexas, substituindo-os por interações naturais em linguagem portuguesa com um Agente de IA.

O público-alvo são **iniciantes em organização financeira** — pessoas que historicamente abandonam aplicativos financeiros na primeira semana por não conseguirem superar a curva de configuração inicial. A hipótese central do produto é que **reduzir o "time-to-value" para menos de 60 segundos** (tempo entre abertura do app e primeiro registro útil) reduzirá o churn de usuários iniciantes em mais de 40%.

---

## 1. Escopo das Telas Principais do MVP

### Arquitetura de Fluxo (User Journey)

```
Onboarding (30s)
    └── Tela de Boas-Vindas + Cadastro via Google/Apple
            └── [CHAT HOME] ← Ponto de entrada principal
                    ├── [EXTRATO] Timeline de transações
                    ├── [METAS] Acompanhamento gamificado
                    └── [INSIGHTS] Análises preditivas
```

---

### 1.1 Tela Principal — Chat / Home

**Objetivo:** Ponto de entrada único. O usuário chega e já pode agir.

| Elemento | Descrição | Prioridade |
|----------|-----------|------------|
| Campo de mensagem | Input multimodal (texto, voz, imagem) | P0 |
| Histórico de mensagens | Timeline de conversas com bolhas ricas | P0 |
| Quick Actions | Atalhos de ação rápida (chips clicáveis) | P0 |
| Status do saldo | Card flutuante com saldo atual | P0 |
| Indicador de digitação | Animação "typing" do agente IA | P0 |
| Gráficos inline | Renderers de charts direto na bolha | P1 |
| Notificações proativas | Alertas do agente sem input do usuário | P1 |

**Comportamentos de IA no Chat (MVP):**
- Registro de transações por linguagem natural ("Gastei R$45 no uber")
- Consulta de saldo e resumo mensal
- Categorização automática sem confirmação do usuário
- Resposta a perguntas abertas sobre finanças pessoais
- Geração de relatório sintético inline

---

### 1.2 Tela — Extrato / Timeline de Transações

**Objetivo:** Visibilidade histórica sem fricção de navegação.

| Elemento | Descrição | Prioridade |
|----------|-----------|------------|
| Lista cronológica | Transações agrupadas por data | P0 |
| Cards de transação | Ícone da categoria + valor + descrição | P0 |
| Cards de resumo | Saldo / Receitas / Despesas do mês | P0 |
| Filtro por tipo | Tabs: Todos / Receitas / Despesas | P1 |
| Busca | Pesquisa por descrição/categoria | P1 |
| Swipe para ações | Editar / Excluir por gesto | P2 |

---

### 1.3 Tela — Metas Gamificadas

**Objetivo:** Engajamento de longo prazo via progresso visual.

| Elemento | Descrição | Prioridade |
|----------|-----------|------------|
| Card de progresso geral | Média ponderada de todas as metas | P0 |
| Cards de meta individual | Barra de progresso + prazo + valor | P0 |
| Criação via chat | "Criar meta de R$5000 para viagem" | P0 |
| Badges de conquista | Marcos percentuais (25%, 50%, 75%, 100%) | P1 |
| Countdown de prazo | Urgência visual quando < 30 dias | P1 |
| Alertas proativos | "Você está 80% da meta X!" | P1 |

---

### 1.4 Tela — Insights Preditivos

**Objetivo:** Transformar dados em ações concretas.

| Elemento | Descrição | Prioridade |
|----------|-----------|------------|
| Feed de alertas | Cards de warning/tip/success | P0 |
| Gráfico de tendência | Área chart receitas vs. gastos (6 meses) | P1 |
| Motor de IA ativo | Status em tempo real do agente | P0 |
| Insights de sazonalidade | "Seu gasto com luz sobe 20% no verão" | P2 |

---

### 1.5 Tela — Configurações de Conexões (Open Finance)

> **Nota MVP:** Tela simplificada, conexão Open Finance vai para v1.1.

| Elemento | Descrição | Prioridade MVP |
|----------|-----------|----------------|
| Lista de bancos conectados | Status de sincronização | P2 (v1.1) |
| Botão "Conectar banco" | Flow OAuth via Open Finance | P2 (v1.1) |
| Configurações de notificação | Toggle por tipo de alerta | P1 |
| Configurações de privacidade | Gestão de dados e LGPD | P0 |

---

## 2. Arquitetura Tecnológica Recomendada

### 2.1 Visão Geral do Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Cliente)                        │
│   React Native (Mobile) / React + Vite (Web PWA)               │
│   Framer Motion · Recharts · Zustand · Tailwind CSS v4         │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / WebSocket
┌──────────────────────────────▼──────────────────────────────────┐
│                          API GATEWAY                             │
│              Kong / AWS API Gateway + WAF                       │
└────────┬───────────────────────────────────────┬────────────────┘
         │                                       │
┌────────▼────────┐                   ┌──────────▼──────────┐
│  BACKEND (Core) │                   │  AI ORCHESTRATION   │
│  Node.js +      │                   │  LangChain / LCEL   │
│  Fastify        │                   │  Claude Sonnet 4.5  │
│  TypeScript     │◄──────────────────│  Whisper (voz)      │
│                 │                   │  GPT-4V (OCR/foto)  │
└────────┬────────┘                   └─────────────────────┘
         │
┌────────▼──────────────────────────────────────────────────────┐
│                       DATA LAYER                               │
│   PostgreSQL (transações) · Redis (cache/sessão)              │
│   Pinecone (embeddings de histórico) · S3 (comprovantes)      │
└───────────────────────────────────────────────────────────────┘
```

---

### 2.2 Frontend

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Framework Web | **React 18 + Vite** | Ecossistema maduro, HMR rápido, excelente para PWA |
| Framework Mobile | **React Native + Expo** | Code-sharing com web, deploy rápido no MVP |
| Animações | **Framer Motion** | API declarativa, physics-based, suporte a gestos |
| Estado global | **Zustand** | Leve, sem boilerplate, TypeScript-first |
| Gráficos | **Recharts** | Composable, responsivo, customizável |
| Estilo | **Tailwind CSS v4** | CSS-first, zero runtime, design system escalável |
| UI Components | **Radix UI (primitivos)** | Acessível, headless, sem estilos impostos |

**Decisão de stack multi-plataforma:**
Para o MVP, recomendo iniciar com **Web (PWA)** — menor custo de development, distribuição imediata sem app stores, e permite validação mais rápida. O React Native vem na v1.1 reaproveitando boa parte da lógica de negócio.

---

### 2.3 Backend

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Runtime | **Node.js 22 LTS** | I/O não-bloqueante ideal para streaming de LLM |
| Framework | **Fastify 5** | 2x mais rápido que Express, plugins TypeScript-native |
| ORM | **Drizzle ORM** | Type-safe, SQL idiomático, migrações declarativas |
| Filas | **BullMQ + Redis** | Jobs de categorização assíncrona, retry automático |
| Auth | **Clerk ou Auth.js** | OAuth nativo, JWT gerenciado, MFA sem código |
| Containerização | **Docker + docker-compose** | Reprodutibilidade entre ambientes |

---

### 2.4 Banco de Dados

| Propósito | Tecnologia | Justificativa |
|-----------|-----------|---------------|
| Dados primários | **PostgreSQL 16 + pgvector** | ACID, extensão vetorial nativa para busca semântica |
| Cache / Sessão | **Redis 7 (Upstash)** | Sub-ms de latência, Serverless-friendly |
| Embeddings | **pgvector** (no próprio PG) | Evita custo de Pinecone no MVP |
| Arquivos | **Cloudflare R2** | S3-compatible, 0 egress fees |
| Analytics | **ClickHouse (v1.1)** | OLAP para insights de comportamento em escala |

---

### 2.5 Modelos de IA/LLM — Análise de Custo-Benefício

#### Casos de Uso e Modelos Recomendados

| Caso de Uso | Modelo Recomendado | Custo/1M tokens | Latência P90 |
|-------------|-------------------|-----------------|--------------|
| **Chat principal (NLP + extração)** | Claude Sonnet 4.5 | ~$3 input / $15 output | ~1.2s |
| **Insights preditivos (raciocínio)** | Claude Opus 4.8 | ~$15 / $75 | ~3s |
| **Categorização em lote** | Claude Haiku 4.5 | ~$0.25 / $1.25 | ~0.3s |
| **Transcrição de voz** | Whisper v3 Large | ~$0.006/min | ~0.8s |
| **OCR de comprovantes** | GPT-4o Vision / Claude 3 Haiku | ~$3.75 input | ~2s |

**Estratégia de roteamento inteligente:**

```typescript
// Roteamento por complexidade da query
const selectModel = (intent: Intent): Model => {
  if (intent.requiresReasoning) return 'claude-opus-4-8'     // ~15% das queries
  if (intent.isBatch)           return 'claude-haiku-4-5'    // ~30% das queries
  return 'claude-sonnet-4-6'                                  // ~55% das queries
}
```

**Estimativa de custo mensal (10.000 usuários ativos):**
- Média de 8 mensagens/dia por usuário
- 80% → Sonnet (~$480/mês)
- 15% → Opus (~$180/mês)
- 5% → Haiku (~$3/mês)
- **Total estimado: ~$663/mês para 10k MAU (~$0.066/usuário/mês)**

#### Prompt Engineering — Arquitetura de Contexto

```
System Prompt (cached — reduz custo em 90%)
  └── Perfil financeiro do usuário (last 30 days)
  └── Categorias personalizadas
  └── Metas ativas
  └── Tom de comunicação definido

User Message
  └── Histórico recente (últimas 10 mensagens)
  └── Entidades extraídas (valor, categoria, data)

Tool Use (Function Calling)
  └── record_transaction(amount, category, type, description)
  └── get_balance(period)
  └── create_goal(title, target, deadline)
  └── get_report(period, breakdown)
  └── search_transactions(query)
```

---

### 2.6 Infraestrutura e Deploy

| Camada | Opção MVP (baixo custo) | Opção Escala (v2+) |
|--------|------------------------|---------------------|
| Backend | Railway / Render | AWS ECS Fargate |
| Banco de dados | Supabase (managed PG) | AWS RDS Aurora |
| Cache | Upstash Redis | AWS ElastiCache |
| CDN | Cloudflare | Cloudflare Enterprise |
| Observabilidade | Sentry + LogSnag | Datadog |

---

## 3. Matriz de Priorização (Esforço × Impacto)

### Metodologia

> Escala de **1 a 5** para Impacto no usuário e Esforço de implementação.  
> **Score = Impacto / Esforço** (quanto maior, mais prioritário)

```
ALTO IMPACTO │ [Metas]           [Chat NLP]      │
             │                                    │
             │ [Categorização]   [Open Finance]   │
             │                                    │
BAIXO IMPACTO│ [Relatórios]      [OCR/Voz]       │
             └──────────────────────────────────────
              BAIXO ESFORÇO      ALTO ESFORÇO
```

### Tabela Completa de Priorização

| # | Funcionalidade | Impacto | Esforço | Score | Sprint |
|---|----------------|---------|---------|-------|--------|
| 1 | Interface de Chat (UI) | 5 | 2 | **2.50** | Semana 1 |
| 2 | Registro via NLP (texto) | 5 | 2 | **2.50** | Semana 1 |
| 3 | Categorização automática (regras) | 5 | 1 | **5.00** | Semana 1 |
| 4 | Consulta de saldo/extrato | 4 | 1 | **4.00** | Semana 1 |
| 5 | Autenticação (Google/Apple OAuth) | 5 | 2 | **2.50** | Semana 1 |
| 6 | Metas (CRUD básico) | 4 | 2 | **2.00** | Semana 2 |
| 7 | Insights básicos (regras heurísticas) | 4 | 2 | **2.00** | Semana 2 |
| 8 | Relatório mensal inline | 3 | 2 | **1.50** | Semana 2 |
| 9 | Quick Actions (chips) | 3 | 1 | **3.00** | Semana 1 |
| 10 | Notificações push | 4 | 3 | **1.33** | Semana 3 |
| 11 | Suporte a voz (Whisper) | 3 | 4 | **0.75** | **v1.1** |
| 12 | OCR de comprovantes | 3 | 4 | **0.75** | **v1.1** |
| 13 | Open Finance / Sync bancário | 5 | 5 | **1.00** | **v1.1** |
| 14 | Categorização por LLM (fine-tuned) | 3 | 4 | **0.75** | **v1.1** |
| 15 | Insights preditivos (ML) | 4 | 5 | **0.80** | **v2.0** |
| 16 | Dashboard de análise avançada | 3 | 4 | **0.75** | **v2.0** |

---

### Roadmap Detalhado

#### Semana 1 — Core Funcional (MVP Mínimo Viável)
**Meta:** Usuário consegue registrar e consultar transações via chat

- [ ] Setup do projeto (Vite + React + TypeScript + Tailwind)
- [ ] Componente de Chat UI com histórico e typing indicator
- [ ] Parser de linguagem natural (regex + regras) para extração de valor/categoria
- [ ] Categorização automática por keywords
- [ ] Store Zustand com persistência em localStorage
- [ ] Tela de Extrato básica
- [ ] Quick Actions chips
- [ ] Autenticação Google OAuth

#### Semana 2 — Enriquecimento
**Meta:** Produto demonstrável para investidores/beta users

- [ ] Integração com Claude Sonnet 4.5 via Anthropic SDK
- [ ] Function calling para ações estruturadas
- [ ] Tela de Metas com barras de progresso animadas
- [ ] Tela de Insights (heurísticas + 3 alertas dinâmicos)
- [ ] Gráficos inline no chat (Recharts)
- [ ] Resumo mensal automático
- [ ] Sistema de badges de conquista

#### Semana 3 — Polimento e Preparação para Beta
**Meta:** 50 usuários beta com onboarding funcional

- [ ] Onboarding conversacional (wizard via chat)
- [ ] Notificações push (Web Push API)
- [ ] Relatórios exportáveis (PDF simples)
- [ ] Ajuste de categorias pelo usuário
- [ ] LGPD: tela de consentimento + gestão de dados
- [ ] Monitoramento (Sentry)
- [ ] Testes A/B de mensagens do agente

#### v1.1 (Semanas 4-8) — Expansão
- [ ] Open Finance API (Belvo ou Pluggy)
- [ ] Transcrição de voz (Whisper API)
- [ ] OCR de comprovantes (GPT-4o Vision)
- [ ] Categorização ML (fine-tune em dados do usuário)
- [ ] App React Native (iOS + Android)
- [ ] Importação de extrato CSV/OFX

---

## 4. Estratégia de Validação e Testes Iniciais

### 4.1 Fase 0 — Validação do Problema (Antes do Código)

**Objetivo:** Confirmar que o problema existe e que a solução conversacional é o formato certo.

**Atividades:**
1. **Entrevistas exploratórias** (n=15, 30min cada)
   - Recrutar via WhatsApp grupos de finanças pessoais
   - Perguntas-chave: "Por que você parou de usar [app financeiro X]?" / "Como você registra seus gastos hoje?"
   
2. **Smoke test via WhatsApp/Telegram**
   - Criar bot manual (Wizard of Oz) onde um humano responde como IA
   - Métricas: % de usuários que registram pelo menos 3 transações em 48h
   - **Critério de go/no-go:** > 60% de retenção no D+2

3. **Landing page com waitlist**
   - Headline: "Controle suas finanças apenas conversando"
   - Demo em vídeo (screen recording do protótipo)
   - Meta: 200 inscrições em 2 semanas

---

### 4.2 Fase 1 — Protótipo de Alta Fidelidade (Semana 0-1)

**Ferramentas:** Figma (prototipagem) + FinBot (app funcional em desenvolvimento paralelo)

**Roteiro de teste de usabilidade (45 minutos por sessão):**

| Tarefa | Critério de Sucesso | Métrica |
|--------|---------------------|---------|
| "Registre que você gastou R$87 no supermercado hoje" | Usuário conclui sem ajuda em < 30s | Time-on-task |
| "Veja quanto você gastou este mês" | Usuário encontra a informação em < 15s | Success rate |
| "Crie uma meta para juntar R$5000 para viagem" | Meta criada sem erros em < 60s | Error rate |
| "Pergunte ao FinBot se você tem dinheiro para uma viagem" | Resposta compreendida e útil | NPS por tarefa |

**Recrutamento:** 8 usuários (Mix: 4 sem experiência com apps financeiros, 2 usuários de apps atuais, 2 heavy users de WhatsApp bot)

---

### 4.3 Fase 2 — Beta Fechado (Semanas 3-6)

**Estratégia de beta:**

```
Semana 3: Onboard 15 usuários (familiares/amigos) — bug catching
Semana 4: Ampliar para 50 usuários (comunidades de finanças)
Semana 5: 150 usuários — grupo de controle vs. experimental
Semana 6: Análise e decisão de go-to-market
```

**North Star Metric:** Usuários que registram 3+ transações na semana 1

**Métricas de sucesso do beta:**

| Métrica | Meta MVP | Meta Aceitável |
|---------|----------|----------------|
| D1 Retention | 60% | 45% |
| D7 Retention | 35% | 25% |
| Transações/usuário/semana | 5+ | 3+ |
| NPS | > 50 | > 30 |
| Time to first transaction | < 60s | < 120s |
| % categorização correta | > 85% | > 70% |

---

### 4.4 Fase 3 — Monitoramento em Produção

**Instrumentação mínima necessária:**

```typescript
// Eventos obrigatórios de tracking
trackEvent('transaction_created', { method: 'chat' | 'form', category, amount_range })
trackEvent('chat_message_sent', { intent_detected, success: boolean, latency_ms })
trackEvent('session_started', { source, is_returning })
trackEvent('goal_created', { target_range, deadline_days })
trackEvent('retention_d1' | 'retention_d7' | 'retention_d30')
```

**Stack de analytics:** PostHog (open-source, self-hostável, LGPD-friendly)

---

## 5. Considerações de Segurança e LGPD

### 5.1 Dados Sensíveis

| Dado | Tratamento | Base Legal (LGPD) |
|------|-----------|-------------------|
| Transações financeiras | Criptografia AES-256 em repouso | Execução de contrato |
| Credenciais bancárias (Open Finance) | Tokenização via Belvo/Pluggy — nunca armazenamos | Consentimento explícito |
| Histórico de chat | Criptografia E2E + retenção de 90 dias | Legítimo interesse |
| Dados de voz | Transcrição apenas, áudio descartado em 24h | Consentimento explícito |
| Fotos de comprovantes | OCR + descarte imediato do arquivo original | Consentimento explícito |

### 5.2 Checklist de Conformidade

- [x] Política de Privacidade clara e em linguagem acessível
- [x] Consentimento granular por finalidade
- [x] Direito de acesso, portabilidade e exclusão de dados
- [x] DPO (Data Protection Officer) designado antes do lançamento público
- [x] Relatório de Impacto (RIPD) para processamento de dados financeiros
- [x] Criptografia TLS 1.3 em trânsito
- [x] Rate limiting no LLM API para evitar abuso
- [x] Auditoria de prompts para evitar prompt injection

---

## Apêndice A — Definições

| Termo | Definição |
|-------|-----------|
| **MAU** | Monthly Active Users — usuários que interagiram ao menos 1x no mês |
| **D1/D7/D30** | Retenção no dia 1, 7, 30 após cadastro |
| **Churn** | Taxa de abandono do aplicativo |
| **NLP** | Natural Language Processing — processamento de linguagem natural |
| **OCR** | Optical Character Recognition — leitura de texto em imagens |
| **Open Finance** | Sistema do Banco Central que permite compartilhamento de dados entre instituições com consentimento |
| **LLM** | Large Language Model — modelo de linguagem de grande escala |
| **LGPD** | Lei Geral de Proteção de Dados (Lei nº 13.709/2018) |
| **Function Calling** | Capacidade do LLM de chamar funções estruturadas determinísticas |

---

*Documento gerado em 16 de junho de 2026 · FinBot Product Team*
