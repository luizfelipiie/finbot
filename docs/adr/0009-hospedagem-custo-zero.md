# 0009 — Hospedagem da API com custo zero: Render Free

- Status: aceito · Data: 20/10/2026 · Decisor: Luiz (opção B do plano da Fase 2)

## Contexto

O objetivo do projeto mudou para portfólio e uso pessoal, com orçamento zero (briefing §1, atualização de 20/10/2026). A regra é usar só serviços gratuitos que **não pedem cartão**, para que nenhuma cobrança seja possível. A API é Java 21 + Spring Boot (ADR 0001) e precisa rodar fora da Vercel.

## Opções

1. **Fly.io.** Região em São Paulo e máquina sempre ligada, mas sem plano gratuito para contas novas e com cartão obrigatório. Custaria cerca de US$ 11 por mês.
2. **Google Cloud Run.** Tem cota gratuita mensal, mas exige conta de faturamento com cartão.
3. **Railway.** O Free dá US$ 1 por mês de crédito, pouco para manter uma JVM ligada.
4. **Render Free.** Serviço web gratuito com Docker, 512 MB e 0,1 de CPU, sem cartão. Sem forma de pagamento cadastrada, o Render suspende o serviço ao estourar um limite, em vez de cobrar. A instância dorme após 15 min sem tráfego e acorda em cerca de 1 min.

## Decisão

Render Free, região Virginia, definido em `render.yaml` (Blueprint), com deploy só de commits cujo CI passou (`autoDeployTrigger: checksPass`).

## Medição antes de decidir

Medido em 20/10/2026 com a imagem de produção num container limitado a `--cpus=0.1 --memory=512m`, contra Postgres local:

| Configuração | Até `/health` responder | Partida do Spring | Memória em uso |
|---|---|---|---|
| JVM com ajustes de memória e C1 | 81 s | 68 s | 159 MB |
| + Class Data Sharing (CDS) | **51–54 s** | 44–46 s | 137 MB |

Ficou a configuração com CDS. O arquivo de CDS é gerado no build da imagem por uma execução de treino que para logo após subir o contexto e não precisa de banco. Margem até o tempo limite de 120 s do proxy da Vercel: cerca de 65 s. A medição no Render de verdade entra no relatório da fase.

## Consequências

- **Primeira abertura lenta:** depois de 15 min sem uso, a primeira requisição espera a API acordar (cerca de 1 min). A partir da Fase 3, o front mostra "Conectando ao servidor…" com nova tentativa automática.
- **Servidor nos EUA:** cerca de 120–150 ms a mais por requisição vinda do Brasil, irrelevante para uso pessoal. O banco fica na mesma região (ADR 0010).
- **Instância reiniciável e sem disco:** o Render pode reiniciar a instância a qualquer momento, então nada pode ficar só em memória ou em arquivo local. Por isso a sessão fica no Postgres (ADR 0011).
- **SMTP bloqueado:** as portas 25, 465 e 587 são fechadas no Free, então o e-mail futuro (Fase 8) terá de usar um provedor por HTTPS.
- **Um serviço só:** a homologação é local (`docker compose`) e o ambiente online é o de uso pessoal.
- **Saída:** se o Render mudar as regras, a API é uma imagem Docker comum e migra para qualquer host. Se nenhum host gratuito servir, ela continua completa no GitHub, rodando local.
- **Plano B de desempenho:** se a partida passar de 120 s no Render, avaliar Spring AOT ou imagem nativa GraalVM (novo ADR).

## Fontes

- Render, plano gratuito: https://render.com/docs/free
- Render, instância gratuita (512 MB, 0,1 CPU): https://render.com/pricing
- Render, Blueprint (`plan: free`, `region: virginia`, `autoDeployTrigger`): https://render.com/docs/blueprint-spec
- Vercel, tempo limite do proxy (120 s): https://vercel.com/docs/limits#proxied-request-timeout
- Spring Boot, Class Data Sharing: https://docs.spring.io/spring-boot/reference/packaging/class-data-sharing.html
- Fly.io, preços: https://docs.fly.io/about/pricing · Railway, preços: https://railway.com/pricing · Cloud Run, preços: https://cloud.google.com/run/pricing
