# Deploy da API (custo zero)

Passo a passo para colocar a API no ar com **Neon Free** (banco) e **Render Free** (API), atrás do proxy da Vercel. Decisões em ADR 0009, 0010 e 0012.

**Regra:** não cadastre cartão em nenhum dos serviços. Sem forma de pagamento, estourar um limite suspende o serviço até o mês seguinte, e nenhuma cobrança é possível.

**Segredos:** cole os valores direto nos painéis. Eles nunca vão para o repositório, para um chat nem para um arquivo versionado.

## 1. Neon (banco)

1. Crie a conta em https://neon.com com login pelo GitHub, sem informar cartão.
2. Crie um projeto:
   - nome `finbot`;
   - **Postgres 17**;
   - região **AWS US East (N. Virginia)**.
3. Em **Connect**, copie os dados da conexão **direta** (com o pooler desligado): host, banco (`neondb`), usuário dono (`neondb_owner`) e senha.
4. Crie o papel da aplicação, que só lê e grava dados:
   1. Gere uma senha forte no seu terminal: `openssl rand -hex 24`.
   2. No **SQL Editor** do projeto, rode o comando abaixo trocando `<senha>`. O editor guarda o histórico de comandos dentro da sua conta Neon.

```sql
CREATE ROLE finbot_app LOGIN PASSWORD '<senha>';
GRANT CONNECT ON DATABASE neondb TO finbot_app;
GRANT USAGE ON SCHEMA public TO finbot_app;
-- Tables and sequences the migrations create from now on:
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO finbot_app;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO finbot_app;
```

## 2. Segredo de origem

Gere o valor que a Vercel envia e a API confere: `openssl rand -hex 32`. Ele vai, igual, no Render (`FINBOT_ORIGIN_SECRET`) e na Vercel (`ORIGIN_SECRET`).

## 3. Render (API)

1. Crie a conta em https://render.com com login pelo GitHub, sem informar cartão.
2. Em **New → Blueprint**, escolha o repositório `finbot`. O Render lê o `render.yaml` da raiz.
3. Ele pede os valores marcados como secretos:

| Variável | Valor |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host-direto>/neondb?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `finbot_app` |
| `SPRING_DATASOURCE_PASSWORD` | a senha criada no passo 1.4 |
| `SPRING_FLYWAY_USER` | `neondb_owner` |
| `SPRING_FLYWAY_PASSWORD` | a senha do `neondb_owner` |
| `FINBOT_ORIGIN_SECRET` | o valor do passo 2 |

4. Confirme. O primeiro build leva alguns minutos. No fim, anote o endereço do serviço, algo como `https://finbot-api.onrender.com`.
5. Confira em **Settings** que o plano é **Free** e que o **Auto-Deploy** está em "After CI checks pass".

## 4. Vercel (front)

No projeto `finbot`, abra **Settings → Environment Variables** e crie as duas variáveis **só no ambiente Production**:

| Variável | Valor |
|---|---|
| `API_ORIGIN` | o endereço do Render, sem barra no fim |
| `ORIGIN_SECRET` | o valor do passo 2 (marque como **Sensitive**) |

Depois, faça um novo deploy de produção para as variáveis entrarem em vigor.

Os previews ficam sem essas variáveis de propósito: eles não alcançam a API nem os seus dados.

## 5. Verificação

Rode no seu computador, dentro de `web/`:

```
npm run smoke -- https://finbot-ochre.vercel.app https://finbot-api.onrender.com
```

O script confere quatro coisas:
- o acesso direto ao Render responde 403;
- pelo proxy, a resposta é 200 e chega ao banco;
- as respostas vêm com `Cache-Control: no-store`, e nada é servido do cache da Vercel;
- o segredo nunca é devolvido.

A primeira chamada pode levar cerca de 1 minuto, se a API estiver dormindo.

## Rotação do segredo de origem

Gere um novo valor e grave-o no Render e na Vercel. Depois, faça novo deploy nos dois. Durante a troca, a API pode responder 403 por alguns segundos.

## Se algo der errado

- **403 pelo proxy:** o `ORIGIN_SECRET` da Vercel não é igual ao `FINBOT_ORIGIN_SECRET` do Render, ou o deploy de produção não foi refeito depois de criar as variáveis.
- **404 ou erro em `/api` na Vercel:** falta o `API_ORIGIN` no ambiente Production.
- **A API não inicia no Render:** veja os logs.
  - `finbot.origin.secret` no erro: falta o `FINBOT_ORIGIN_SECRET` ou ele tem menos de 32 caracteres.
  - Erro de conexão: confira a URL JDBC, que precisa usar o host **direto** e terminar em `?sslmode=require`.
- **Serviço suspenso:** um limite gratuito do mês acabou. Ele volta sozinho no mês seguinte. Os seus dados continuam na Neon.
