# 0003 — Painel-first, chat como canal de entrada

- Status: aceito · Data: 19/10/2026 · Decisor: Luiz
- Contexto completo: `docs/diagnostico.md`, seções 1.1 e 5.2.

## Contexto

O MVP original (`docs/historico/MVP_SPECIFICATION.md`) era chat-first, com o LLM como núcleo. O briefing pede painel-first, com o LLM só como fallback. Hoje o chat é o único caminho de registro: não tem confirmação nem desfazer, e concentra as falhas silenciosas.

## Decisão

- A tela inicial é o painel Início (saldo e situação do mês).
- O chat deixa de ser um destino da navegação: entra pelo botão "+" ("Registrar por texto") e, na Fase 6, pelo WhatsApp.
- Todo registro feito por texto passa por confirmação antes de ser gravado.
- `MVP_SPECIFICATION.md` fica arquivado como histórico em `docs/historico/`, e o briefing prevalece em qualquer conflito.

## Consequências

- O registro rápido por formulário (Fase 3) e o parser pt-BR determinístico (Fase 6) passam a ser os caminhos principais; o LLM nunca produz números.
- A arquitetura de informação proposta no diagnóstico (seção 5.2) será validada na Fase 1.
