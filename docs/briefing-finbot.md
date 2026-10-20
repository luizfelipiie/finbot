# FinBot — Briefing de reestruturação

> **Para o Claude Code.** Este arquivo é a fonte de verdade do projeto durante a reestruturação. Ele fica em `docs/briefing-finbot.md`; as imagens citadas ficam em `docs/referencias/`. Comece pela Fase 0 (seção 14). Não escreva código antes da minha aprovação explícita.

## Resumo em uma tela

1. Redesenhar o app com um design system sóbrio, preto e amarelo, sem "cara de IA".
2. Corrigir o núcleo financeiro para que todo número seja correto e explicável.
3. Entregar: painel inicial, compromissos fixos e assinaturas, revisão do mês, caixinhas 2.0, carteira de investimentos com cálculos reais e registro de gastos pelo WhatsApp.
4. Segurança e LGPD de verdade — o app vai guardar a vida financeira de pessoas próximas a mim.
5. Trabalhar em fases, com minha aprovação entre elas, começando por um diagnóstico sem código.

---

## 1. Contexto

- Sou o Luiz, dono do projeto. Construí o FinBot quando estava aprendendo, inteiramente gerado por IA. Ele está parado, cheio de erros, e o visual não passa confiança — ninguém registra a vida financeira num app que parece que vai vazar dados.
- Objetivo: transformar o FinBot em um produto confiável. Primeiro público: amigos e família (beta fechado, 10 a 50 pessoas). Havendo tração, comercializar.
- Minha prioridade declarada é o visual e a experiência. Mas não aceito um app bonito por cima de cálculo errado ou dado inseguro — a ordem das fases reflete isso.
- O repositório é público e fixado no meu GitHub: também é vitrine profissional. Qualidade de código, testes e documentação contam.
- Quero publicar na Vercel.
- Trabalho com Java 21 e Spring Boot e busco vaga de desenvolvedor back-end. Isso entra como critério — não como imposição — na escolha da stack do back-end.

> **Atualização em 20/10/2026 — orçamento zero.** O objetivo passa a ser **portfólio no GitHub e uso pessoal**. O beta com amigos e família e a comercialização ficam suspensos até nova decisão minha. Regra de custo: **só serviços gratuitos que não exijam cartão cadastrado**, para que nenhuma cobrança seja possível. Requisitos que dependem de infraestrutura paga (backup diário automático, servidor sempre ligado) são substituídos por alternativas gratuitas, registradas no plano de cada fase. Todo o resto do briefing continua valendo: qualidade, testes, segurança e documentação são o que dá valor ao portfólio.

## 2. Seu papel e postura

Atue como um time sênior condensado em uma pessoa:

- **Staff Engineer** — arquitetura, modelagem de dados, segurança, testes, CI/CD, deploy.
- **Product Designer sênior de fintech** — design system, UX de dados financeiros, visualização de dados, acessibilidade.
- **Product Manager** — escopo, priorização, critérios de aceite, métricas.

Postura esperada:

- Seja direto e crítico. Se uma ideia minha for ruim, diga por quê e proponha alternativa com trade-offs. Não concorde por educação.
- Toda decisão relevante vem com opções consideradas, trade-offs e justificativa. Registre em `docs/adr/NNNN-titulo.md` (ADR curto).
- Não invente. Se não sabe como algo funciona no código, leia o código. Se depende de serviço externo (API, preço, termos de uso, legislação), consulte a documentação oficial vigente e cite a fonte no ADR ou no relatório.
- Encontrou discrepância — entre este briefing e o código, entre números, entre dados? Mostre para mim antes de tentar resolver.
- Ambiguidade que muda o resultado: pergunte. Ambiguidade com padrão óbvio: decida, registre e siga.
- Comunicação comigo em português. Código, identificadores e commits em inglês; textos da interface em português do Brasil.

## 3. Processo de trabalho

1. O trabalho é dividido em fases (seção 14). Cada fase segue: **plano → minha aprovação → implementação → relatório → minha aprovação**. Nunca emende duas fases.
2. O plano de cada fase contém: objetivo; escopo e fora de escopo; módulos e arquivos afetados; mudanças no modelo de dados; riscos; estratégia de testes; critérios de aceite verificáveis; tamanho relativo (P/M/G).
3. Git: uma branch por fase (`fase-N-descricao`), commits pequenos em Conventional Commits, PR com descrição e checklist. Sem force-push na `main`. PR só entra com CI verde.
4. Não remova funcionalidade existente sem listar antes e eu aprovar.
5. Nenhuma dependência nova sem justificativa: o que resolve, alternativa considerada, peso no bundle, saúde da manutenção.
6. Relatório de fase em `docs/fases/fase-N.md`: o que foi feito; decisões e trade-offs; como testar (passo a passo); prints em mobile (390px) e desktop (1280px) quando houver interface; pendências; riscos; proposta para a fase seguinte.
7. Na Fase 0, proponha um `CLAUDE.md` curto (até ~80 linhas) com as regras permanentes deste briefing (processo, regras visuais, regras do núcleo financeiro, segurança) e um apontador para este arquivo. Crie após minha aprovação. Não importe o briefing inteiro no `CLAUDE.md`: ele é carregado em toda sessão e o custo de contexto não compensa — leia este arquivo sob demanda, na seção da fase corrente.

## 4. Estado atual observado

Print: `docs/referencias/00-estado-atual.png`. Problemas visíveis — a Fase 0 deve confirmar cada um e explicar a causa raiz:

- Menu lateral com itens sobrepostos: "Configurações" por cima de "Metas" e "Sair" por cima de "Insights".
- O chat não responde: "Ver saldo" (18:35) e "Gastei R$50 no mercado" (18:36) ficaram sem resposta e nenhum erro foi exibido. Falha silenciosa.
- O card "Gastos por categoria" aparece vazio: sem gráfico e sem estado vazio.
- Ordem e horário inconsistentes: um card das 22:41 aparece acima de mensagens das 18:35, sem separador de data.
- Números que não fecham: "Todas as contas R$ 6.000,00" com Entrada R$ 4.0k e Saída R$ 0.0k; o gasto de R$ 50 não aparece em Saída.
- Formatação misturada: "R$ 6.000,00" (pt-BR) ao lado de "R$ 4.0k" (en-US).
- Status fictício "Online · Resposta imediata" num bot que não respondeu.
- Emojis como ícones, verde neon e roxo competindo como cor de destaque, tudo com borda totalmente arredondada, avatar genérico "U".

## 5. O que o produto é — e o que não é

- **É:** um app de finanças pessoais confiável, mobile-first, em pt-BR, com registro rápido (inclusive pelo WhatsApp), visão clara do mês, compromissos fixos, caixinhas, carteira de investimentos e revisão mensal dos gastos.
- **Não é (agora):** banco, meio de pagamento, consultoria de investimentos (não recomendar ativos — atividade regulada pela CVM), contabilidade empresarial.
- **Princípio:** todo número exibido é explicável. Tocar em qualquer total abre as transações que o compõem.
- **Mudança estrutural proposta:** hoje o app é chat-first. Proponho painel-first: a tela inicial é o painel; o chat vira canal de entrada (botão de registro rápido e WhatsApp) e de consultas rápidas. Valide na Fase 0.

## 6. Direção visual e design system

### 6.1 Referências em `docs/referencias/` (direção, não cópia)

- `01-rosca-e-assinaturas.png` — cartões de próximas cobranças (nome, valor por mês, dias restantes) e a ideia de um gráfico de rosca, com as ressalvas da seção 8.
- `02-boas-vindas-e-metas.png` — saudação com nome e cartão de saldo logo no topo; metas com barra de progresso, meta, valor guardado e prazo; paleta preto e amarelo.
- `03-carteira.png` — cartão de carteira com total, variação e resultado; seletor de período na análise.

### 6.2 Regras obrigatórias (fim da "cara de IA")

- Zero emojis na interface. Ícones de uma única biblioteca (sugestão: Lucide), traço de 1,5px, tamanhos 16/20/24, cor neutra.
- Sem neon, glow, sombra colorida, glassmorphism ou gradiente decorativo. Exceção possível: um gradiente tonal sutil no cartão de saldo, só se eu aprovar no preview.
- Uma única cor de destaque — o amarelo —, usada com parcimônia: ação primária, foco, item selecionado e o dado mais importante da tela. Nunca para enfeitar.
- Raio de borda em escala fixa: 4px (badges, tags), 8px (botões, inputs, chips), 12px (cards). Formato pílula só em avatar e indicador de status.
- Elevação por degraus de superfície e borda de 1px, não por sombra.
- Tipografia: uma família sans profissional (Inter ou Geist — escolha e justifique), pesos 400/500/600. Valores monetários sempre com algarismos tabulares (`font-variant-numeric: tabular-nums`). Em valores de destaque, "R$" e centavos menores e em cor secundária.
- Grade de espaçamento de 4px; margem lateral de 16px no mobile.
- Movimento: 150–200ms, ease-out, só como feedback (hover, toque, abrir e fechar). Nada de contador animando saldo. Respeitar `prefers-reduced-motion`.
- Texto sóbrio e direto, sem exclamações nem gírias. Exemplo de estado vazio: "Nenhuma despesa em outubro. Registre pelo botão + ou pelo WhatsApp."

### 6.3 Paleta inicial

Proponha os valores finais, valide contraste (WCAG 2.2 AA) e mostre tudo no preview.

| Token | Ponto de partida |
|---|---|
| Fundo | ~#0A0A0B |
| Superfícies (3 degraus) | ~#121214 · ~#1A1A1D · ~#232327 |
| Borda | ~#27272A |
| Texto primário / secundário / terciário | ~#EDEDEF · ~#A1A1AA · ~#71717A |
| Destaque (3 opções para eu escolher) | âmbar suave ~#F2C94C · amarelo quente ~#F5D547 · amarelo-lima ~#DDF24A |
| Positivo / negativo | verde dessaturado ~#4CB782 · vermelho dessaturado ~#E5534B |
| Atenção | laranja ~#F0883E — nunca amarelo, para não colidir com a marca |

- Texto sobre amarelo é sempre escuro.
- Cor nunca é o único portador de significado: receita e despesa também levam sinal (+/−) e ícone.
- Tema escuro é o padrão; os tokens já ficam prontos para um tema claro futuro.

### 6.4 Implementação

- Tokens (cor, raio, espaçamento, tipografia, movimento, z-index) em CSS variables consumidas pela camada de estilo (Tailwind, se for a escolha). Nenhuma cor hardcoded em componente.
- Componentes base: Button (primário, secundário, ghost, destrutivo), Input, MoneyInput (máscara pt-BR), Select, DatePicker, Card, Tabs, SegmentedControl, Badge, Tooltip, Dialog e BottomSheet, Toast, ProgressBar, Amount (formatação monetária única do app), EmptyState, Skeleton, ErrorState, Table (desktop) e List (mobile).
- Toda tela tem os estados: carregando (skeleton), vazio (com ação), erro (com "tentar de novo") e sem conexão.
- Formatação centralizada: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`; abreviação "R$ 4,2 mil" (nunca "4.2k"); datas "Hoje", "Ontem", "19 out", "19/10/2026".
- Modo privacidade: botão de olho que oculta todos os valores (R$ ••••), lembrado por dispositivo.
- Acessibilidade: contraste AA, alvo de toque ≥ 44px, foco visível, rótulo em todo botão de ícone, gráfico sempre com alternativa textual (legenda com valores).

## 7. Navegação e telas

### 7.1 Estrutura

- **Mobile (prioridade):** barra inferior com Início · Transações · [+] · Planejar (compromissos fixos e caixinhas) · Carteira. Revisão do mês como aba dentro de Transações e acessível pelo cartão de pendências do Início. Configurações pelo avatar no topo. É uma proposta inicial — valide a arquitetura de informação na Fase 1.
- **Desktop:** barra lateral com os mesmos destinos, conteúdo com largura máxima de ~1200px; tabelas onde o mobile usa listas.
- **PWA instalável** (manifest, ícones, splash), para funcionar como app no celular sem loja. Sem cache offline de dados financeiros.

### 7.2 Início

De cima para baixo:

1. Saudação por horário e primeiro nome ("Boa noite, Luiz") + botão do modo privacidade.
2. Cartão de saldo: **Saldo em contas** em destaque (corrente, poupança e dinheiro — sem caixinhas, investimentos ou cartão). Linha secundária com **Fatura em aberto** (se houver cartão) e **Patrimônio** (contas + caixinhas + investimentos − faturas em aberto). Toque abre o detalhamento por conta.
3. Resumo do ciclo: receitas, despesas e guardado, com variação contra o mesmo intervalo do ciclo anterior (do dia 1 ao 19 contra do dia 1 ao 19 — comparação justa).
4. Rosca "Para onde foi sua renda" (seção 8).
5. Próximas cobranças: cartões horizontais com assinaturas e contas fixas dos próximos 15 dias.
6. Pendências de revisão ("12 lançamentos para conferir em outubro") — só aparece se houver.
7. Caixinhas: as 2 ou 3 principais com progresso.
8. Carteira: aplicado, valor atual e resultado — só se o usuário usar investimentos.
9. Últimas 5 transações + "ver todas".

### 7.3 Transações

- Lista agrupada por dia com total diário; busca; filtros (período, conta, categoria, tipo, origem, status de revisão, faixa de valor).
- Criar, editar e excluir com "desfazer". Transferência entre contas é um tipo próprio.
- Registro rápido: valor (teclado numérico com máscara), descrição, categoria sugerida automaticamente, conta, data (padrão hoje), forma de pagamento, parcelas.

### 7.4 Compromissos fixos e assinaturas

- Cartões como na referência 01: nome, valor por mês, próxima cobrança ("em 2 dias"), conta ou cartão, status (pago, pendente, atrasado).
- No topo: "Compromissos fixos: R$ X/mês (Y% da renda)" e "Assinaturas: R$ Z/mês". Assinatura anual também aparece como equivalente mensal.
- Parcelamentos ativos e "já comprometido nos próximos 6 meses".
- Detecção automática: mesmo estabelecimento, valor parecido e intervalo de cerca de um mês → sugerir "Isso parece uma assinatura. Adicionar?".
- Sem logos de marcas por ora: monograma (inicial) em fundo neutro. Evita depender de serviço de logos e expor a terceiros o que o usuário assina.

### 7.5 Revisão do mês (a "planilha inteligente")

Objetivo: em poucos minutos o usuário confere se o que está registrado é o que ele gastou de fato — e o app aprende com isso.

- Agrupamento por estabelecimento normalizado: "Posto Shell", "posto shell av. x" e "SHELL*1234" viram um grupo. Colunas: estabelecimento, quantidade, total, média, categoria, variação contra a média dos 3 ciclos anteriores, progresso de conferência (7/9).
- Expandir um grupo mostra as transações: data, valor, conta, descrição original, "conferido", "não reconheço", editar.
- Visões: por estabelecimento (padrão), por categoria e lista completa — no desktop, tabela densa com ordenação, filtros e edição inline; no mobile, lista.
- Ações em lote: marcar como conferido, mudar categoria, mesclar estabelecimentos, renomear, criar regra ("quando a descrição contiver X → estabelecimento Y, categoria Z", aplicada também aos lançamentos futuros), marcar como recorrente.
- Alertas determinísticos: possível duplicidade (mesmo valor, estabelecimento e dia), gasto fora do padrão da categoria, estabelecimento novo.
- Progresso ("32 de 47 conferidos") e ação "Concluir revisão de outubro".
- Exportação: XLSX formatado (moeda e data pt-BR) e CSV compatível com o Excel brasileiro (separador `;`, decimal com vírgula, UTF-8 com BOM).
- Gatilho: no início de cada ciclo, a revisão do ciclo anterior fica disponível com um cartão no Início. Não abrir modal toda vez que o app abre.

### 7.6 Caixinhas

- Caixinha é dinheiro separado do saldo em contas. Aporte e resgate são **transferências** — nunca receita nem despesa, para não distorcer o mês.
- Cada caixinha: nome, ícone da biblioteca, cor da paleta, onde o dinheiro está (conta ou instituição), meta e prazo (opcionais), aporte mensal planejado (opcional).
- Exibir: guardado, % da meta, quanto falta, **ritmo necessário** (R$/mês para chegar no prazo), **projeção** no ritmo dos últimos 3 meses ("chega lá em mar/2027"), histórico de aportes e resgates com motivo opcional.
- Rendimento opcional: "rende X% do CDI" → estimativa com a série oficial do CDI (seção 11), rotulada como estimativa.
- Reserva de emergência como tipo especial: meta sugerida = N × média mensal dos gastos essenciais recentes (N configurável, padrão 6).
- Estados: ativa, concluída, arquivada. Concluir uma meta tem confirmação sóbria — sem confete.
- Hoje existe "Metas" no menu; descubra na Fase 0 se é a caixinha atual e mapeie a migração.

### 7.7 Configurações

Perfil; contas; categorias; regras de classificação; vínculo do WhatsApp; segurança (sessões ativas, sair de todos os dispositivos); privacidade (exportar meus dados, excluir minha conta); preferências, incluindo o **dia de início do ciclo mensal** (quem recebe no dia 5 enxerga o mês do dia 5 ao dia 4).

Perfis: hoje existem "2 perfis". Descubra o propósito na Fase 0 e proponha manter (ex.: separar pessoal e negócio), transformar em espaço compartilhado (casal ou família) ou remover.

## 8. Gráficos — decisões

**Rosca (donut).** Serve apenas para parte-de-um-todo com total significativo e no máximo 4–5 fatias. Não serve para comparar categorias (o olho compara mal ângulos) nem para evolução no tempo.

- **Uso principal: "Para onde foi sua renda".** O todo é a receita do ciclo (recebida + prevista por recorrência, com a prevista sinalizada). Quatro fatias fixas, sempre na mesma ordem e cor: compromissos fixos · gastos variáveis · guardado e investido · disponível.
- O **disponível** desconta também os compromissos previstos e ainda não pagos no ciclo (aluguel que vence dia 25, fatura a vencer). Essa parte prevista aparece hachurada — o uso honesto do segmento listrado da referência.
- O número central corresponde à fatia destacada em amarelo; recomendo "Disponível R$ X". As demais fatias em tons de cinza. Legenda sempre visível com valor e %; tocar numa fatia abre as transações dela.
- **Estouro:** se despesas + guardado passarem da receita, a rosca não representa o excedente. Troque por barra horizontal com o valor excedido ("Você usou R$ 412 a mais do que recebeu"), na cor negativa.
- **Sem receita registrada no ciclo:** não mostrar a rosca; mostrar estado vazio pedindo o registro da renda.
- Segundo uso aceitável: alocação da carteira por classe de ativo.

**Gastos por categoria:** barras horizontais ordenadas (top 5 + "Outros"), com marcador do ciclo anterior. Rosca não.

**Evolução no tempo:** barras (receita × despesa por mês) e linhas (patrimônio; carteira com "valor aplicado" × "valor de mercado" — a distância entre as linhas é o resultado).

**Regras gerais:** período explícito no título ("Outubro de 2026"), tooltip com valor e %, eixo de barras começando em zero, nada de 3D, sombra ou gradiente, uma única biblioteca de gráficos (sugestão: Recharts — avalie peso e acessibilidade).

**Pré-requisito:** transferências (caixinha, investimento, pagamento de fatura) nunca contam como despesa. Sem isso, todos os gráficos mentem.

## 9. Núcleo financeiro — regras inegociáveis e modelo de dados

### 9.1 Regras

1. **Dinheiro nunca em ponto flutuante.** Centavos em inteiro (BIGINT) ou NUMERIC(14,2); cálculo com inteiros ou biblioteca decimal; arredondamento explícito e documentado. `toFixed` não é ferramenta de cálculo. Moeda única BRL por ora.
2. **Saldo é derivado** (saldo inicial + transações), nunca um campo editado à mão. Se houver cache, ele precisa ser reconciliável e testado.
3. **Datas:** a data da transação é DATE no fuso do usuário (padrão America/Sao_Paulo), sem hora. Timestamps técnicos em UTC (`timestamptz`). Assim um lançamento das 22h não cai no dia — ou no mês — errado.
4. **Transferência é tipo próprio** (origem → destino). Aporte e resgate de caixinha, aplicação e resgate de investimento e pagamento de fatura são transferências.
5. **Cartão de crédito:** compra é despesa na data da compra, vinculada ao cartão; a fatura é a soma do ciclo (dias de fechamento e vencimento); pagar a fatura é transferência da conta para o cartão. Compra parcelada gera N lançamentos, um por fatura, ligados por grupo ("parcela 3 de 10"). Relatórios de gasto usam a data da compra; a projeção de caixa usa o vencimento da fatura.
6. **Origem e idempotência:** todo lançamento registra a origem (manual, assistente do app, WhatsApp, importação) e uma chave de idempotência (id da mensagem, hash da linha importada) que impede duplicidade.
7. **Exclusão lógica** (soft delete) para permitir desfazer e auditar; exclusão definitiva só no fluxo de excluir conta.
8. **Multiusuário desde o início:** todo dado tem dono e todo acesso é filtrado por ele (seção 12).

### 9.2 Entidades mínimas (proponha o esquema final na Fase 2)

- **users** (+ perfis, conforme a decisão da Fase 0).
- **accounts:** corrente, poupança, dinheiro, cartão de crédito (fechamento e vencimento), caixinha, investimento; instituição; saldo inicial e data.
- **categories:** hierarquia de um nível; tipo receita ou despesa; natureza padrão fixa ou variável; categorias padrão em pt-BR, editáveis.
- **transactions:** tipo, valor, data, conta, conta de destino (transferência), categoria, estabelecimento, natureza fixa/variável (herdada da recorrência ou do padrão da categoria, editável), forma de pagamento, recorrência, grupo de parcelas, origem, chave de idempotência, status de revisão, observação, timestamps, `deleted_at`.
- **merchants** e **merchant_aliases:** normalização e mescla de estabelecimentos.
- **classification_rules:** condição → categoria / estabelecimento / natureza, com prioridade; aplicadas a toda entrada nova, de qualquer origem.
- **recurrences:** assinaturas e contas fixas (valor esperado, valor variável sim/não, frequência, dia, conta, categoria, início e fim, status, lembrete), com ocorrências previstas conciliadas com as transações reais.
- **savings_boxes:** meta, prazo, aporte planejado, rendimento opcional.
- **investimentos:** seção 11.
- **audit_log:** login, vínculo de WhatsApp, exportação, exclusão e alterações sensíveis.

Categorias padrão sugeridas (ajuste o que achar melhor):

- Despesas: Moradia · Contas da casa · Mercado · Alimentação fora · Transporte · Saúde · Educação · Lazer · Assinaturas · Compras · Cuidados pessoais · Pets · Presentes e doações · Impostos e taxas · Tarifas bancárias · Outros.
- Receitas: Salário · Freelance e serviços · Rendimentos · Reembolsos · Outros.

### 9.3 Migração e testes

- Dados atuais: script de migração com relatório de divergências **antes** de aplicar. Casos de classificação ambíguos vêm listados para eu decidir — não chute.
- Testes unitários do núcleo: saldo; transferências não afetam despesas; cartão, fatura e parcelas; virada de mês com fuso; ciclo mensal customizado; arredondamento. Meta: ≥ 90% de cobertura no domínio financeiro.

## 10. Registro por mensagem — assistente do app e WhatsApp

### 10.1 Arquitetura

Um único núcleo de interpretação com adaptadores de canal (chat do app, WhatsApp; outros no futuro). A mesma frase gera o mesmo resultado em qualquer canal.

1. **Parser determinístico primeiro:** valores pt-BR ("45", "45,90", "R$ 1.234,56", "1,5 mil", "45 reais"), datas relativas ("ontem", "sexta"), forma de pagamento ("no débito", "no pix", "em 3x no Nubank"), intenção (gastei, paguei, comprei, recebi).
2. **Categoria e estabelecimento** pelas regras de classificação e pelo histórico do próprio usuário.
3. **LLM só como fallback** para frases ambíguas: modelo pequeno e barato, saída estruturada validada por schema, lista fechada com as categorias e contas do usuário, mínimo de dados enviados (nada de saldos ou histórico completo). A mensagem do usuário é dado, não instrução — proteja contra prompt injection.
4. **Regra de ouro: o LLM nunca produz números.** Saldos, totais e resumos vêm sempre de consultas determinísticas ao banco; o LLM, no máximo, identifica a intenção e os parâmetros.
5. **Toda gravação por mensagem é reversível:** a resposta resume o que foi registrado ("Despesa · R$ 45,00 · Transporte · Uber · Nubank · hoje") com as opções Desfazer e Editar. Confiança baixa → perguntar antes de gravar ("R$ 50 com o quê?").
6. **Falha nunca é silenciosa:** o usuário recebe mensagem clara e o erro é registrado.
7. **Conjunto "golden"** com 150+ frases reais em português e o resultado esperado, rodando no CI.

Consultas do MVP: saldo, resumo do mês, quanto gastei com X no período, próximas cobranças, progresso de caixinha. Fora disso, resposta curta dizendo o que o bot faz. É um bot de função específica, não um assistente geral.

### 10.2 WhatsApp

- **Somente a API oficial** (WhatsApp Business Platform / Cloud API da Meta). Proibido usar bibliotecas que automatizam o WhatsApp Web (Baileys, whatsapp-web.js e serviços construídos sobre elas): violam os termos, arriscam banimento do número e exigem manter uma sessão de WhatsApp num servidor — inaceitável num app financeiro.
- **Número dedicado** ao FinBot, nunca o meu pessoal. Conta Meta Business com verificação — eu inicio o cadastro em paralelo às primeiras fases; me diga cedo o que preciso providenciar.
- **Vínculo seguro:** no app, o usuário gera um código de uso único (expira em 10 minutos) e envia ao número do FinBot ("vincular 482913"). Isso prova a posse das duas pontas e registra o opt-in. Guarde o `wa_id` exatamente como chega no webhook — números brasileiros podem vir sem o nono dígito, então não dependa do número digitado pelo usuário. Números não vinculados recebem só instruções de cadastro.
- **Webhook:** validar a assinatura (`X-Hub-Signature-256` com o app secret), responder 200 rápido e processar de forma assíncrona (fila), idempotência pelo id da mensagem (a Meta reenvia eventos), rate limit por usuário, logs sem conteúdo financeiro em texto puro.
- **Custos — confirme na documentação oficial antes de implementar** (https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing). Desde 1º/10/2026, as respostas dentro da janela de 24h (service messages) têm franquia de 1.000 por mês por número de telefone e depois são cobradas; sem forma de pagamento cadastrada, a Meta para de entregar quando a franquia acaba. Mensagens iniciadas pelo app fora da janela exigem template e são cobradas. Consequências de projeto:
  - uma única resposta consolidada por lançamento, com botões interativos em vez de várias mensagens;
  - lembretes proativos pelo WhatsApp fora do MVP (no MVP, avisos dentro do app) e, no futuro, só com opt-in;
  - métrica de mensagens enviadas e custo estimado por usuário ativo;
  - alerta interno ao atingir 80% da franquia mensal.
- **Termos da Meta:** há restrições a chatbots de IA de uso geral na API, com disputa no CADE no Brasil. Manter o bot com escopo fechado nos deixa fora dessa discussão. Confirme os termos vigentes antes do lançamento.
- **Desenvolvimento local:** túnel HTTPS (ex.: cloudflared ou ngrok) e número de teste da Meta.
- **LGPD:** a política de privacidade informa que as mensagens trafegam pela Meta; o usuário pode desvincular a qualquer momento.
- **Futuro (fora de escopo, mas não bloqueie na arquitetura):** áudio com transcrição, foto de cupom e QR Code de NFC-e, importação de extrato OFX/CSV, Open Finance via agregador.

## 11. Carteira de investimentos — cálculos reais

### 11.1 Escopo do MVP

- Classes: renda fixa (CDB, LCI, LCA, Tesouro Selic, prefixados), ações, FIIs, ETFs e cripto. Tesouro IPCA+ e ativos em dólar ficam para depois (cadastro manual por ora).
- Entrada: operações manuais (compra e venda: data, quantidade, preço unitário, custos) e proventos (dividendos, JCP, rendimentos). Futuro: importação dos relatórios da Área do Investidor da B3.

### 11.2 Cálculos (cada um com testes usando exemplos conferidos à mão)

- **Preço médio ponderado**, incluindo custos de compra; vendas não alteram o preço médio.
- **Resultado realizado** na venda = (preço de venda × qtd − custos) − (preço médio × qtd).
- **Resultado não realizado** = qtd × cotação atual − qtd × preço médio.
- **Resultado total** = realizado + não realizado + proventos líquidos.
- **Rentabilidade da carteira** no período pelo método de cotas (TWR), para não distorcer com aportes em datas diferentes. Se exibir "lucro ÷ aplicado", rotule como "retorno simples sobre o custo".
- **Comparação** com o CDI (e com o Ibovespa, se a fonte de dados permitir) no mesmo período.
- **Renda fixa pós-fixada (% do CDI):** acumular o fator diário do CDI × percentual contratado, só em dias úteis, com calendário de feriados nacionais (ANBIMA). **Tesouro Selic:** mesmo princípio com a Selic diária. **Prefixada:** (1 + taxa)^(du/252).
- Títulos e CDBs exibem "valor na curva", rotulado como tal; marcação a mercado (preços do Tesouro Transparente) fica para depois. Exibir valor bruto e "líquido estimado".
- **Tributação** (IR regressivo, IOF, isenções): regras em tabela configurável com data de vigência e fonte — nunca hardcoded. Verifique a legislação vigente ao implementar. IR de renda variável e DARF ficam fora do MVP.

### 11.3 Dados de mercado

- Indicadores oficiais: API SGS do Banco Central (CDI diário — série 12; Selic diária — série 11; IPCA mensal — série 433; confirme os códigos).
- Cotações de B3 e cripto: avalie provedores (ex.: brapi.dev, CoinGecko; Yahoo Finance é não oficial) quanto a termos de uso, limites, custo, atraso e confiabilidade. Implemente atrás de uma interface de provedor, com cache.
- Sempre exibir "cotação de 19/10 às 14:32" e marcar dado desatualizado. Nunca inventar cotação: sem dado novo, mostrar o último conhecido com aviso.
- Nenhuma recomendação de compra ou venda.

### 11.4 Interface (referência 03)

Cartão com Aplicado · Valor atual · Resultado (R$ e %); seletor de período (mês, 12 meses, desde o início); linha "aplicado × valor de mercado"; alocação por classe (rosca permitida aqui); lista de ativos com quantidade, preço médio, cotação e resultado.

## 12. Segurança e privacidade (LGPD) — inegociáveis

Confiança não é estética: o visual sóbrio só vale se for verdadeiro por baixo.

- **Segredos:** nenhuma chave no front-end. Variáveis `VITE_*` vão para o bundle público — qualquer chave de LLM ou de serviço pago ali está exposta. Na Fase 0, varra o repositório **e o histórico do git** (ex.: gitleaks). O repositório é público: qualquer chave encontrada deve ser tratada como comprometida e rotacionada. Me avise imediatamente.
- **Autenticação:** provedor ou biblioteca consolidada (ex.: Supabase Auth, Auth.js) — nada de JWT caseiro em localStorage. Sessão em cookie httpOnly/Secure/SameSite, rate limit e bloqueio progressivo no login, recuperação de senha segura, listagem e revogação de sessões. Deixar caminho pronto para 2FA (TOTP) e passkeys.
- **Autorização:** isolamento por usuário em todas as consultas. Se usar Supabase, Row Level Security em todas as tabelas, com testes automatizados provando que o usuário A não lê nem altera dados do usuário B.
- **Entrada:** validação no servidor (ex.: Zod), consultas parametrizadas ou ORM, nada de `dangerouslySetInnerHTML` com conteúdo de mensagem.
- **Transporte e cabeçalhos:** HTTPS em tudo, CSP, HSTS, `frame-ancestors`, CORS restrito.
- **Logs e monitoramento:** sem dados pessoais nem valores em texto puro; monitoramento de erros (ex.: Sentry) com scrubbing.
- **Backups:** automáticos e diários, com um teste de restauração documentado.
- **Dependências:** auditoria no CI e atualização automatizada (Dependabot ou Renovate).
- **LGPD:** política de privacidade e termos em linguagem simples, consentimento no cadastro, exportação dos dados do usuário (JSON/CSV), exclusão definitiva da conta, minimização de dados, registro no audit_log. Nunca pedir nem guardar senha de banco ou número de cartão.
- **Interface honesta:** nenhum status fictício, nenhum selo de segurança que não seja verdade.

## 13. Qualidade de engenharia

- TypeScript em modo strict (se o projeto estiver em JS, proponha a migração na Fase 0), sem `any` injustificado; ESLint e Prettier.
- Testes: unitários (Vitest ou o runner existente) para domínio e parser; Testing Library nos componentes críticos; E2E com Playwright para cadastro e login, registrar despesa, transferir para caixinha (não altera despesas), revisão do mês, vínculo e lançamento via WhatsApp (webhook simulado).
- CI no GitHub Actions: lint, typecheck, testes, build, varredura de segredos e auditoria de dependências.
- Ambientes separados (desenvolvimento e produção) com bancos separados. Seeds com dados fictícios realistas para demo e prints — nunca dados reais fora de produção.
- Performance: gráficos carregados sob demanda, orçamento de bundle, Lighthouse mobile ≥ 90 em desempenho e acessibilidade nas telas principais.
- Documentação: README (setup, scripts, arquitetura, `.env.example`), ADRs e relatórios de fase.
- **Deploy:** avalie se back-end, webhooks, filas e tarefas agendadas (fechamento de ciclo, atualização de cotações e índices) cabem no modelo serverless da Vercel ou se pedem um serviço ou worker separado. Justifique.

## 14. Roadmap por fases

Cada fase termina com relatório e minha aprovação.

### Fase 0 — Diagnóstico e plano (sem código)

Entregue `docs/diagnostico.md` com:

1. Stack, arquitetura e fluxo de dados atuais (diagrama simples): onde e como os dados são persistidos hoje (banco, localStorage, arquivo?), como o chat funciona e por que não responde.
2. Inventário das funcionalidades (perfis, contas, metas, insights, transações, chat): funciona / parcial / quebrada.
3. Achados por severidade (crítica, alta, média, baixa), com evidência (`arquivo:linha`): segurança, integridade financeira (float, saldos, datas, transferências), bugs da seção 4, UI/UX, acessibilidade, testes, dependências.
4. Recomendação por camada (front, back, banco): refatorar ou reescrever, com critérios e custo. Proposta de stack-alvo com trade-offs. Se for reescrever o front, ponto de partida sugerido: React + Vite + TypeScript, Tailwind com tokens, componentes acessíveis (Radix ou shadcn/ui customizado), TanStack Query, React Hook Form + Zod, PostgreSQL gerenciado (ex.: Supabase). Para o back, compare TypeScript com Java 21 + Spring Boot em produtividade, deploy (Spring Boot exigiria hospedar o back fora da Vercel) e valor de portfólio — a decisão é minha.
5. Rascunho do modelo de dados e da arquitetura de informação.
6. Proposta do `CLAUDE.md` (seção 3, item 7).
7. Plano das próximas fases com tamanho relativo (P/M/G) e riscos.

Se encontrar segredo exposto, pare tudo e me avise antes de continuar.

**PARE AQUI e aguarde minha aprovação.**

### Fase 1 — Correções críticas e design system

- Correções críticas apontadas na Fase 0 (segredos, autorização), se houver.
- Tokens, componentes base e estados; rota `/design-system` (ou Storybook — justifique).
- Protótipo navegável da tela Início com dados fictícios, em 390px e 1280px, nas 3 opções de amarelo.
- Arquitetura de informação e navegação para aprovação.

### Fase 2 — Núcleo financeiro

- Modelo de dados, migrações e script de migração dos dados atuais (relatório de divergências antes de aplicar).
- Contas, transações, transferências, cartão, fatura e parcelas, categorias, regras de classificação, recorrências, idempotência, soft delete.
- Autenticação e autorização revisadas, com testes de isolamento entre usuários.
- Testes do domínio.

### Fase 3 — Novo app: Início e Transações

- Shell de navegação (mobile e desktop) e PWA; Início completo; Transações; registro rápido; modo privacidade.
- Onboarding: contas e saldo inicial, renda, compromissos fixos comuns (checklist: aluguel, luz, água, internet, celular, streaming), vínculo do WhatsApp (opcional, quando existir).

### Fase 4 — Compromissos fixos, assinaturas e caixinhas

- Escopo nas seções 7.4 e 7.6, incluindo detecção automática de assinaturas e migração das "Metas" atuais.

### Fase 5 — Revisão do mês e exportação

- Escopo na seção 7.5: agrupamento por estabelecimento, conferência, regras, alertas e exportação XLSX/CSV.

### Fase 6 — Registro por mensagem

- Escopo na seção 10. Ordem: núcleo de interpretação e conjunto golden → assistente no app → WhatsApp (vínculo, webhook, fila, custos, limites).

### Fase 7 — Carteira de investimentos

- Escopo na seção 11, com os cálculos validados por testes antes de qualquer tela.

### Fase 8 — Prontidão para o beta

- LGPD completa (políticas, exportação, exclusão), monitoramento, backups testados, deploy de produção, checklist de segurança revisado, convite do beta fechado, canal de feedback no app.
- Métricas do beta, sem rastreamento invasivo: ativação (ex.: 10+ lançamentos na primeira semana), retenção semanal, % de lançamentos via WhatsApp, conclusão da revisão mensal, custo por usuário ativo. Definimos as metas juntos antes do beta.

## 15. O que não fazer

- Escrever código antes do plano aprovado.
- Usar float para dinheiro.
- Usar emoji, neon, gradiente decorativo ou borda oval.
- Exibir número que não possa ser detalhado até as transações.
- Deixar falha silenciosa (catch vazio, promise sem tratamento).
- Colocar segredo no front-end ou commitar `.env`.
- Usar biblioteca não oficial de WhatsApp.
- Deixar o LLM gerar valores, saldos ou totais.
- Inventar cotação, índice, regra tributária, preço de API ou comportamento de serviço externo.
- Ampliar o escopo da fase ou remover funcionalidade sem me perguntar.

## 16. Primeira ação

Leia este briefing inteiro e as imagens em `docs/referencias/`. Execute somente a Fase 0. Nesta fase você não altera código da aplicação: o único arquivo criado é `docs/diagnostico.md`. Ao terminar, me apresente um resumo executivo (até 15 linhas) com os achados críticos e as decisões que preciso tomar, e aguarde.
