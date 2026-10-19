# FinBot 💚

**Aplicativo de finanças pessoais com interface conversacional.**

Registre gastos e receitas conversando, em linguagem natural. Sem formulários e sem planilhas.

<!-- Quando tiver um print ou GIF do chat, salve em docs/ e descomente a linha abaixo -->
<!-- ![FinBot em uso](docs/finbot.gif) -->

---

## ✨ Funcionalidades

- **Chat em linguagem natural:** registre lançamentos digitando frases como *"Gastei R$50 no mercado pelo Nubank"*
- **Múltiplos perfis:** você, cônjuge ou empresa, com dados totalmente separados
- **Múltiplas contas:** Nubank, Itaú, Carteira, Poupança e outras, cada uma com saldo e histórico próprios
- **Categorização automática:** Alimentação, Transporte, Lazer, Saúde e outras categorias identificadas pelo texto
- **Metas gamificadas:** objetivos financeiros com barras de progresso animadas
- **Insights automáticos:** alertas sobre padrões de gastos e saúde financeira
- **Relatórios no chat:** gráficos e resumos gerados direto na conversa
- **Responsivo:** funciona no desktop e no celular

---

## 🛠 Tech Stack

| Camada | Tecnologia |
| --- | --- |
| Front-end | React 19 + Vite |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS 4 |
| Animações | Framer Motion |
| Gráficos | Recharts |
| Estado | Zustand |
| API | Node.js + Express 5 (REST) |
| Persistência | Arquivo JSON local |

---

## 🚀 Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/luizfelipiie/finbot.git
cd finbot

# Instale as dependências
npm install

# Sobe o front e a API juntos
npm run dev
```

- Front-end: **http://localhost:5173**
- API: **http://localhost:3001**

Para subir cada parte separadamente, use `npm run dev:ui` e `npm run dev:api`.

Os dados ficam salvos em `finbot-data.json`, na raiz do projeto. Esse arquivo é criado na primeira gravação e não vai para o repositório.

---

## 🔌 API

O front consome uma API REST em Express, que persiste os dados em arquivo JSON.

| Recurso | Endpoints |
| --- | --- |
| Perfis | `GET /api/profiles` · `POST /api/profiles` · `DELETE /api/profiles/:id` |
| Contas | `GET /api/accounts/:profileId` · `POST /api/accounts` · `PUT /api/accounts/:id` · `DELETE /api/accounts/:id` |
| Transações | `GET /api/transactions/:profileId` · `POST /api/transactions` · `PUT /api/transactions/:id` · `DELETE /api/transactions/:id` |
| Metas | `GET /api/goals/:profileId` · `POST /api/goals` · `PUT /api/goals/:id` · `DELETE /api/goals/:id` |
| Mensagens | `GET /api/messages/:profileId` · `POST /api/messages` |

Regras de negócio na API:

- Excluir um perfil remove em cascata as contas, transações, metas e mensagens dele.
- Excluir uma conta remove as transações dessa conta.
- O histórico do chat guarda as últimas 200 mensagens por perfil, e a listagem retorna as 100 mais recentes.

---

## 📁 Estrutura do projeto

```
finbot/
├── server/
│   ├── index.js              # API Express: rotas REST de perfis, contas, transações, metas e mensagens
│   └── storage.js            # Leitura e gravação do arquivo JSON
├── src/
│   ├── components/
│   │   ├── ChatView.tsx          # Tela principal do chat
│   │   ├── ChatMessage.tsx       # Bolhas de mensagem com gráficos inline
│   │   ├── ChatInput.tsx         # Input com ações rápidas
│   │   ├── Sidebar.tsx           # Navegação, perfis e contas
│   │   ├── TransactionsView.tsx  # Extrato com filtros
│   │   ├── GoalsView.tsx         # Metas com barras de progresso
│   │   ├── InsightsView.tsx      # Insights e gráfico de tendência
│   │   ├── AccountModal.tsx      # Modal de nova conta
│   │   ├── ProfileModal.tsx      # Modal de novo perfil
│   │   └── MobileNav.tsx         # Navegação mobile
│   ├── store/
│   │   └── useFinanceStore.ts    # Store Zustand, interpretação das frases e lógica de negócio
│   ├── App.tsx
│   └── index.css
└── public/
```

---

## 💬 Comandos do chat

| O que digitar | O que acontece |
| --- | --- |
| `Gastei R$80 no restaurante pelo Nubank` | Registra uma despesa na conta Nubank |
| `Recebi R$3000 de salário` | Registra uma receita |
| `Qual meu saldo?` | Mostra o resumo financeiro com gráfico |
| `Resumo do mês` | Gera relatório de gastos por categoria |
| `Ver minhas metas` | Lista as metas com o progresso |
| `Minhas contas` | Lista as contas cadastradas |

---

## 🧭 Próximos passos

- Validar os campos aceitos em cada rota antes de gravar
- Trocar o arquivo JSON por um banco (SQLite ou PostgreSQL) para suportar acessos simultâneos
- Publicar o front na Vercel e a API no Railway
- Adicionar testes automatizados para as rotas da API

---

## 👤 Autor

**Luiz Felipe de Sá Naves Peixoto**

[LinkedIn](https://www.linkedin.com/in/luiz-felipe-3aa401360/) · [GitHub](https://github.com/luizfelipiie)

## 📄 Licença

MIT
