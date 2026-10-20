# 0001 — Back-end em Java 21 + Spring Boot

- Status: aceito · Data: 19/10/2026 · Decisor: Luiz
- Contexto completo: `docs/diagnostico.md`, seção 4.

## Contexto

O back-end atual (Express + arquivo JSON) será reescrito: não tem autenticação, validação nem regras de domínio. O briefing pede que se compare TypeScript com Java 21 + Spring Boot em produtividade, deploy e valor de portfólio. O dono do projeto busca vaga de back-end Java.

## Opções

1. **TypeScript** (Hono/Fastify ou funções da Vercel + Supabase): uma linguagem só, tipos compartilhados com o front e tudo hospedado na Vercel. Fila e agendamento precisariam de serviço externo, e o valor de portfólio para a vaga buscada é baixo.
2. **Java 21 + Spring Boot**: `BigDecimal`, `java.time`, JPA/Flyway e Testcontainers são fortes para o domínio financeiro. Um processo sempre ligado resolve webhook, fila e agendamentos. O custo é operar dois deploys (front na Vercel, API num host de containers) e um começo mais lento.

## Decisão

Java 21 + Spring Boot como API e núcleo de domínio, PostgreSQL gerenciado como banco e front-end na Vercel.

## Consequências

- O contrato entre front e back será OpenAPI, com cliente TypeScript gerado para evitar DTOs duplicados à mão.
- A escolha do host da API e do provedor do Postgres, e entre Spring Security com sessão e JWT do Supabase Auth, fica para ADRs da Fase 2. Preços e limites serão consultados na documentação vigente e citados lá.
- Até a Fase 2, a API Express atual continua só como protótipo local; nenhuma funcionalidade nova entra nela.
