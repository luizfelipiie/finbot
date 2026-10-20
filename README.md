# FinBot

Aplicativo de finanças pessoais em português, mobile-first: visão clara do mês, compromissos fixos, caixinhas, carteira de investimentos e registro rápido de gastos, inclusive pelo WhatsApp. Todo número exibido é explicável até as transações que o compõem.

> **Em reestruturação.** O projeto está sendo reconstruído em fases, com plano, decisões e relatório documentados em [`docs/`](docs/). A versão atual do novo app é um protótipo navegável com dados fictícios.

![Início no celular](docs/fases/fase-1/inicio-390-quente.png)

## Estrutura

```
web/      app novo: React 19 + Vite + TypeScript strict + Tailwind 4 (Fase 1 em diante)
api/      API em Java 21 + Spring Boot 4, Postgres e Flyway (Fase 2 em diante)
legacy/   protótipo original, congelado até ser substituído na Fase 3
docs/     briefing, diagnóstico, ADRs, planos e relatórios de fase
```

## Rodando o app novo

Requer Node 22.22 ou mais recente.

```bash
cd web
npm install
npm run dev            # http://localhost:5173
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` | ESLint e verificação de cores fora dos tokens |
| `npm run format:check` | Prettier |
| `npm run typecheck` | TypeScript strict |
| `npm test` | Testes de unidade e de componente (Vitest + Testing Library) |
| `npm run test:e2e` | E2E em 390px e 1280px com verificação de acessibilidade (Playwright + axe). Na primeira vez: `npx playwright install chromium` |
| `npm run build` | Build de produção |
| `npm run prints` | Gera os prints do relatório de fase |
| `npm run smoke -- <app> <api>` | Confere o proxy da API no deploy ([guia](docs/deploy.md)) |

Rotas úteis: `/` (Início), `/design-system` (tokens, contraste e componentes). A barra do protótipo troca a cor de destaque e o cenário de dados (mês normal, estouro, sem receita, carregando, erro, sem conexão).

## Rodando a API

Requer Java 21 e Docker em execução (banco local e testes de integração).

```bash
cd api
docker compose up -d                                       # Postgres local na porta 55432
./mvnw spring-boot:run -Dspring-boot.run.profiles=local    # http://127.0.0.1:8080
```

Com a API e o `npm run dev` do `web/` rodando, o front alcança a API em `/api`, como em produção.

| Comando | O que faz |
| --- | --- |
| `./mvnw verify` | Testes de unidade e de integração (Postgres real via Testcontainers) e cobertura do domínio |
| `./mvnw spring-boot:test-run` | Sobe a API com um Postgres descartável, sem `docker compose` |
| `docker build -t finbot-api .` | Imagem de produção |

Deploy com custo zero (Render Free + Neon Free, sem cartão): [`docs/deploy.md`](docs/deploy.md).

## Rodando o protótipo antigo

```bash
cd legacy
npm install
npm run dev            # UI em http://localhost:5173, API em http://127.0.0.1:3001
```

Os dados ficam em `legacy/finbot-data.json`, fora do git, com backup automático a cada gravação. A API aceita conexões só da própria máquina.

## Princípios

- Dinheiro em centavos inteiros, nunca ponto flutuante. Datas no fuso do usuário.
- Saldo sempre derivado das transações; transferência nunca conta como receita ou despesa.
- Interface acessível (WCAG 2.2 AA), sem dados ou selos fictícios apresentados como reais.
- Regras completas em [`CLAUDE.md`](CLAUDE.md) e no [briefing](docs/briefing-finbot.md).

## Documentação

- [Diagnóstico (Fase 0)](docs/diagnostico.md)
- [Decisões de arquitetura (ADRs)](docs/adr/)
- [Planos e relatórios de fase](docs/fases/)
- [Deploy da API](docs/deploy.md)
- [Preparação do WhatsApp](docs/whatsapp-preparacao.md)

## Autor

**Luiz Felipe de Sá Naves Peixoto** · [LinkedIn](https://www.linkedin.com/in/luiz-felipe-3aa401360/) · [GitHub](https://github.com/luizfelipiie)

## Licença

MIT
