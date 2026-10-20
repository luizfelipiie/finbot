# 0002 — Workspaces no lugar de perfis

- Status: aceito · Data: 19/10/2026 · Decisor: Luiz
- Contexto completo: `docs/diagnostico.md`, seção 5.3 e achado A-09.

## Contexto

Os dois perfis "Meu Perfil" existentes são resultado de um bug de inicialização duplicada (A-09), não de uma decisão de produto. Ainda assim, separar contextos (pessoal, casal, negócio) é uma necessidade plausível.

## Opções

1. **Remover perfis:** cada usuário tem um único conjunto de dados. É o mais simples, mas qualquer separação futura exigiria migração.
2. **Workspaces:** todo dado pertence a um `workspace`, e cada usuário nasce com o seu espaço pessoal. Espaços compartilhados ficam para depois, sem migração.
3. **Manter perfis como estão:** vários conjuntos de dados sob o mesmo login, sem dono claro. Isso confunde autorização e LGPD.

## Decisão

Workspaces (opção 2). No beta, a interface mostra só o espaço pessoal; não há seletor de perfil.

## Consequências

- O esquema da Fase 2 tem `workspace_id` em toda entidade de dados, e a autorização verifica a participação do usuário no workspace.
- Os testes de isolamento cobrem usuário × workspace.
- O seletor de perfis da interface atual não será reproduzido no app novo.
