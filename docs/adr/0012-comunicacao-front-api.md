# 0012 — Front e API na mesma origem, pelo proxy da Vercel

- Status: aceito · Data: 20/10/2026 · Decisor: Luiz (plano da Fase 2)

## Contexto

O front é servido pela Vercel e a API roda no Render (ADR 0009), em outro domínio (`onrender.com`). A sessão será um cookie `httpOnly` (ADR 0011), e o Safari do iPhone bloqueia cookies de terceiros. Os dados são financeiros, então nenhuma resposta da API pode ficar em cache.

## Opções

1. **Front chama a API direto, com CORS.** O cookie da API seria de terceiros para o site e o Safari o bloquearia, quebrando o login no iPhone. Exigiria domínio próprio para resolver.
2. **Proxy da Vercel (rewrite para origem externa).** O navegador só fala com `finbot-ochre.vercel.app`; a Vercel encaminha `/api/*` para o Render. Mesma origem, cookie first-party e sem CORS.
3. **Vercel Function como proxy.** O mesmo efeito, com código a manter e limites de execução de função. Fica como plano B.

## Decisão

Opção 2, configurada em `web/vercel.json`:

- **Proxy:** uma regra em `routes` encaminha `/api/(.*)` para `${API_ORIGIN}/api/$1`. A variável `API_ORIGIN` só existe no ambiente Production da Vercel, então os previews não alcançam a API.
- **Segredo de origem:**
  - a mesma regra grava o cabeçalho `x-origin-secret` com `${ORIGIN_SECRET}`;
  - a operação `set` substitui qualquer valor enviado pelo visitante, como recomenda a documentação da Vercel;
  - a API recusa com 403 tudo que chegar sem o segredo, comparado em tempo constante (`OriginSecretFilter`). A única exceção é `GET /health`, que não devolve dados;
  - sem o segredo configurado, a API nem inicia.
- **Sem cache, com duas travas:**
  - a API responde `Cache-Control: no-store` em tudo, até nas recusas (`NoStoreFilter`);
  - a Vercel desliga o cache de `/api/*` com `x-vercel-enable-rewrite-caching: 0`. Projetos criados a partir de 06/04/2026, como este, respeitam por padrão os cabeçalhos de cache da origem.
- **Fallback do app:** o fallback do app de página única exclui `/api/`, para uma rota da API nunca virar `index.html`.
- **CSP:**
  - `script-src` e `connect-src` só aceitam `'self'`;
  - `frame-ancestors 'none'` e `object-src 'none'`;
  - `style-src` permite `'unsafe-inline'`, porque o Radix injeta estilos em `<style>` (bloqueio de rolagem dos diálogos) e um site estático não tem como usar nonce. Scripts inline continuam proibidos.
- **Desenvolvimento local:** o Vite encaminha `/api` para a API local com um segredo de desenvolvimento, que não é um segredo de verdade e só vale no perfil `local`.

## Consequências

- **Domínio:** não é preciso domínio próprio.
- **Verificação automática:**
  - `src/app/vercel-config.test.ts` protege a configuração do proxy;
  - o `vite preview` serve a mesma CSP de produção, e os testes E2E falham em qualquer violação;
  - `npm run smoke -- <app> <api>` confere o deploy real: 403 direto, 200 pelo proxy, `no-store`, nada vindo do cache e o segredo nunca devolvido.
- **Rotação do segredo:** gerar um novo valor, gravar no Render e na Vercel e fazer um novo deploy. A API aceita um valor só, então há segundos de 403 durante a troca, o que é aceitável para uso pessoal.
- **Ponto a validar no primeiro deploy:** os cabeçalhos `Set-Cookie` atravessarem o rewrite intactos, o que entra no PR de autenticação. Se não atravessarem, aplicar a opção 3, com novo ADR.

## Fontes

- Vercel, rewrites para origens externas, segredo de origem e cache: https://vercel.com/docs/routing/rewrites
- Vercel, `routes`, `transforms` e variáveis de ambiente: https://vercel.com/docs/project-configuration/vercel-json#routes
- Vercel, tempo limite do proxy: https://vercel.com/docs/limits#proxied-request-timeout
- WebKit, bloqueio de cookies de terceiros: https://webkit.org/tracking-prevention/
- MDN, Content-Security-Policy: https://developer.mozilla.org/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
