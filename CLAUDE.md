# FinBot — regras permanentes

Fonte de verdade: `docs/briefing-finbot.md`. Leia só a seção da fase corrente, sob demanda.
Diagnóstico: `docs/diagnostico.md`. Decisões: `docs/adr/`. Planos e relatórios: `docs/fases/`.

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
- Todo dado tem dono (workspace, ADR 0002); toda consulta é filtrada por ele, com teste de isolamento.
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

## Estrutura e comandos
- `web/` app novo · `api/` Spring Boot 4 + Postgres · `legacy/` protótipo antigo congelado (sem features novas).
- Custo zero: só serviços gratuitos sem cartão (Render Free + Neon Free, ADR 0009/0010). Deploy em `docs/deploy.md`.
- Em `web/`: `npm run dev` · `lint` (inclui guarda de cores) · `format:check` · `typecheck` · `test` · `test:e2e` · `build` · `prints` · `smoke`.
- Em `api/`: `docker compose up -d` (Postgres em 55432) · `./mvnw spring-boot:run -Dspring-boot.run.profiles=local` · `./mvnw verify` (Docker aberto). Esquema só por Flyway.
- Antes de concluir qualquer mudança em `web/`: lint, typecheck, test e test:e2e verdes; em `api/`: `./mvnw verify` verde.
- Dinheiro só por `src/lib/money.ts` e `<Amount>`; datas só por `src/lib/dates.ts`; cores só em `src/styles/tokens.css`.
- Em `legacy/`: `npm run dev` (UI 5173 + API 127.0.0.1:3001); dados em `legacy/finbot-data.json`, fora do git.
