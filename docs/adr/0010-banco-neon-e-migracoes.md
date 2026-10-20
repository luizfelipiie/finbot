# 0010 — Banco: Neon Free com migrações Flyway e papéis separados

- Status: aceito · Data: 20/10/2026 · Decisor: Luiz (opção B do plano da Fase 2)

## Contexto

A API precisa de Postgres gerenciado (ADR 0001) dentro da regra de custo zero sem cartão (ADR 0009). O banco guarda dados financeiros, então o esquema precisa ser versionado e a aplicação não deve ter mais permissão do que usa.

## Opções

1. **Render Postgres Free.** Na mesma rede da API, mas expira 30 dias depois de criado e é apagado após mais 14 dias.
2. **Supabase Free.** 500 MB; o projeto é pausado após 1 semana sem uso e precisa ser reativado à mão.
3. **Neon Free.** Plano permanente, sem cartão: 1 GB por projeto, 100 CU-hora por mês, compute que suspende após 5 min sem consultas e acorda sozinho em centenas de milissegundos, restauração das últimas 6 h.

## Decisão

- **Neon Free** na região `aws-us-east-1`, a mesma área do Render Virginia, e Postgres 17, a mesma versão usada nos testes com Testcontainers.
- **Esquema só por Flyway** (`api/src/main/resources/db/migration`). O Hibernate apenas valida (`ddl-auto=validate`) e nunca altera o banco.
- **Dois papéis:**
  - o dono do banco (`neondb_owner`) roda as migrações, via `SPRING_FLYWAY_USER`;
  - a aplicação usa `finbot_app`, que só lê e grava dados (`SELECT`, `INSERT`, `UPDATE`, `DELETE`), sem permissão de DDL.
  
  Os comandos estão em `docs/deploy.md`.
- **Conexão direta, sem pooler:** com no máximo 5 conexões, o pooler da Neon não é necessário, e o Flyway funciona melhor numa conexão direta.

## Consequências

- **Ociosidade de verdade:** a Neon só suspende o compute depois de 5 min sem consultas e recomenda fechar conexões ociosas. Por isso:
  - o pool do Hikari não mantém conexões paradas (`minimum-idle=0`) e fecha as ociosas em 60 s, antes do primeiro ping de keepalive (a cada 2 min);
  - o `/health`, que o Render consulta com frequência, não toca no banco.
  
  Sem esses dois cuidados, o compute ficaria acordado o mês todo e as 100 CU-hora acabariam.
- **Backup:** o Free restaura só as últimas 6 h, então o backup diário pedido no briefing §13 é substituído pela exportação JSON do workspace (`GET /api/export`, ainda nesta fase), que você baixa quando quiser.
- **Primeiro acesso:** quando API e banco estão dormindo, os dois tempos de partida se somam. O do banco é desprezível perto do da API.

## Fontes

- Neon, planos e limites do Free: https://neon.com/pricing · https://neon.com/docs/introduction/plans
- Neon, scale to zero e conexões ociosas: https://neon.com/docs/introduction/scale-to-zero · https://neon.com/docs/introduction/compute-lifecycle · https://neon.com/docs/introduction/cost-optimization
- Neon, regiões: https://neon.com/docs/introduction/regions
- Render, Postgres gratuito (expiração em 30 dias): https://render.com/docs/free
- Supabase, preços: https://supabase.com/pricing
- HikariCP, `idleTimeout` e `keepaliveTime`: https://github.com/brettwooldridge/HikariCP#gear-configuration-knobs-baby
