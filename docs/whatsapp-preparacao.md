# WhatsApp: preparação da conta (iniciar já)

> Fase 6 depende de prazos externos da Meta. Este passo a passo é para você começar agora, sem código.
> Consultado em 20/10/2026 na documentação oficial (fontes no fim). Confira de novo antes de cada etapa, porque a Meta muda regras e preços com frequência.

## O que você precisa ter em mãos

- Uma conta do Facebook (ou conta Meta gerenciada) em seu nome.
- **Um número de telefone dedicado ao FinBot**, que seja seu, com DDI e DDD, e que receba SMS ou ligação. O número **não pode estar em uso no WhatsApp** (nem no Messenger nem no Business app). Se estiver, precisa ser apagado de lá antes. Depois de registrado na API, ele deixa de funcionar no app do WhatsApp, mas continua recebendo ligações e SMS. Recomendo um chip pré-pago novo, usado só para isso.
- Os dados do seu negócio para a verificação (razão social ou MEI, CNPJ, endereço, site com domínio próprio). A verificação não é obrigatória para começar, mas destrava limites (ver abaixo).

## Passo a passo

1. **Cadastre-se como desenvolvedor da Meta** em developers.facebook.com, com sua conta.
2. **Crie um portfólio empresarial** (antigo Business Manager) em business.facebook.com, com o nome "FinBot" ou o nome do seu negócio.
3. **Crie um app no Painel de Apps da Meta** com o caso de uso WhatsApp e vincule ao portfólio do passo 2.
4. Em *API Setup*, **crie a conta do WhatsApp Business** e anote o ID dela. A Meta fornece um **número de teste**; com ele já dá para enviar mensagens para até alguns números cadastrados, suficiente para desenvolver a Fase 6.
5. **Adicione o número dedicado**, com o nome de exibição "FinBot" e um PIN de verificação em duas etapas (guarde-o num gerenciador de senhas). O nome de exibição passa por revisão da Meta.
6. **Inicie a verificação do negócio** no portfólio (Central de Segurança → Verificação). Pode levar dias ou semanas, por isso a recomendação de começar já.
7. **Cadastre uma forma de pagamento** na conta do WhatsApp Business (necessária para cobranças acima da faixa gratuita).
8. **Não gere token permanente ainda.** Na Fase 6 eu crio o usuário de sistema com as permissões mínimas (`whatsapp_business_messaging`, `whatsapp_business_management`) e o token vai direto para o cofre de segredos do back-end, nunca para o repositório.

## O que isso significa para o FinBot

| Tema | Regra vigente | Impacto |
|---|---|---|
| Limite de envio | Portfólio novo: 250 usuários únicos por 24h **fora** da janela de atendimento. Sobe para 2.000 com a verificação do negócio. | O FinBot responde quem escreveu (dentro da janela), então o limite pesa pouco no beta. |
| Números por portfólio | Começa com 2 números registrados; sobe para 20 com verificação. | Suficiente. |
| Preço | Cobrança por mensagem entregue, por categoria e país. Mensagens de atendimento (resposta dentro da janela de 24h) **voltaram a ser cobradas em 01/10/2026**, com **1.000 grátis por mês por número**. Mensagens do usuário para a empresa não são cobradas. Brasil tem tabela própria, faturada em BRL. | Beta de 10 a 50 pessoas registrando gastos tende a caber na faixa grátis; acima disso, custo por mensagem. Estimativa com números reais fica no ADR da Fase 6. |
| Política de IA | Desde 15/01/2026 os termos proíbem provedores de IA de oferecer assistentes de propósito geral pela API. Uso de IA a serviço do próprio negócio continua permitido. | O FinBot registra lançamentos com parser determinístico e LLM só como apoio, dentro do próprio produto. Fica dentro da regra, mas o ADR da Fase 6 cita o texto vigente dos termos. |
| Bibliotecas não oficiais | Proibidas pelo briefing; também violam os termos da Meta. | Só Cloud API oficial. |

## Fontes

- Meta for Developers, *Cloud API, Get started*: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- Meta for Developers, *Business phone numbers*: https://developers.facebook.com/docs/whatsapp/cloud-api/phone-numbers
- Meta for Developers, *Messaging limits*: https://developers.facebook.com/docs/whatsapp/messaging-limits
- Meta for Developers, *Business accounts*: https://developers.facebook.com/docs/whatsapp/overview/business-accounts
- Meta for Developers, *Pricing*: https://developers.facebook.com/docs/whatsapp/pricing
- Política de IA (cobertura da imprensa; conferir o texto atual dos *WhatsApp Business Solution Terms* antes da Fase 6): https://9to5mac.com/2025/10/20/whatsapp-bans-ai-chatbots-from-using-its-business-api/
