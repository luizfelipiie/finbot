# 0004 — Documentação e referências dentro do repositório

- Status: aceito · Data: 19/10/2026 · Decisor: Claude, por delegação do Luiz
- Contexto: discrepâncias D1 e D5 em `docs/diagnostico.md`.

## Contexto

O briefing, as imagens de referência e a especificação antiga estavam fora do repositório, em `projeto_finanças/`. O repositório é público e funciona como vitrine profissional. As referências 01–03 são capturas de apps de terceiros.

## Decisão

```
docs/
  briefing-finbot.md     fonte de verdade da reestruturação (versionado)
  diagnostico.md         Fase 0 (versionado)
  adr/                   decisões (versionado)
  fases/                 planos e relatórios de fase (versionado)
  historico/             MVP_SPECIFICATION.md arquivado (versionado)
  referencias/
    00-estado-atual.png  print do próprio app, só com dados fictícios (versionado)
    01..03-*.png         capturas de terceiros: só locais, no .gitignore
```

## Por quê

- O processo documentado (briefing → diagnóstico → ADRs → fases) é parte do valor de portfólio.
- Publicar capturas de produtos de terceiros num repositório público traz risco de direito de imagem e marca sem trazer ganho, já que o briefing descreve em texto o que cada referência ensina (seção 6.1).
- O `.gitignore` também passa a cobrir `finbot-data.json`, backups dele e `.env*`.

## Consequências

Quem clonar o repositório não verá as imagens 01–03; os caminhos citados no briefing continuam valendo localmente.
