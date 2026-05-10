# Revisão técnica de segurança interna - Etapa 10

Documento operacional inicial para revisão técnica e jurídica futura. Este relatório não substitui auditoria de segurança, parecer jurídico ou avaliação formal de conformidade com LGPD/LGPD infantil.

## Escopo revisado

- Next.js App Router, Prisma, Supabase PostgreSQL, Stripe, Gemini/IA e painel admin.
- Fluxos principais: cadastro, login, perfil, criança, benefícios, pagamentos, conversas com IA, voz, privacidade e admin.
- Revisão baseada no estado atual do código.

## 1. `.env.local` não rastreado pelo Git

Status: OK.

- `.env.local` não aparece em `git ls-files`.
- `.gitignore` contém `.env` e `.env.local`.
- `.env.example` está rastreado e usa placeholders.

Observação: manter o cuidado para nunca copiar chaves reais para `.env.example`, README, issues ou prints públicos.

## 2. Chaves secretas apenas no backend

Status: parcialmente OK.

- `DATABASE_URL` é usada em `src/lib/prisma.ts` e scripts Prisma/seed.
- `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` são usadas em `src/lib/stripe.ts` e no webhook.
- `GEMINI_API_KEY`/`OPENAI_API_KEY` são lidas em `src/lib/gemini.ts`, usado por rotas internas.
- Não foi encontrada leitura direta dessas chaves em componentes client.

Ponto de atenção: `NEXT_PUBLIC_APP_URL` é público por definição e deve conter apenas a URL pública do app.

## 3. `passwordHash` nunca retornado ao frontend

Status: OK no fluxo principal.

- Login compara `passwordHash` no backend e retorna usuário sem esse campo.
- Cadastro retorna apenas dados seguros do usuário.
- APIs de usuário/admin usam `select`/mapeamentos sem `passwordHash`.
- O schema contém `passwordHash`, mas ele não deve sair das rotas.

Ponto de atenção: manter esse padrão em qualquer nova API de usuário.

## 4. Rotas admin protegidas

Status: parcialmente OK para MVP, pendente para produção real.

- Páginas admin usam `AdminProtectedRoute`.
- O componente consulta `GET /api/admin/me`, que verifica se o usuário tem `role ADMIN`.
- Usuário não admin recebe mensagem de acesso restrito.

Pendência importante: as APIs `/api/admin/*` ainda não fazem, em geral, uma verificação server-side obrigatória de admin para cada requisição. Hoje a proteção está principalmente no frontend/página, baseada em sessão local. Para produção, cada API admin precisa validar autenticação/autorização no servidor, idealmente com sessão segura via cookie/JWT e checagem de role no backend.

## 5. Dados de crianças minimizados

Status: parcialmente OK.

- A maior parte das telas exibe apenas dados necessários: nome, idade, ano escolar, idioma, nível, avatar, plano e progresso.
- Não existe perfil público de criança no app.
- Não foi encontrada busca pública por crianças.
- Não existe chat entre usuários.
- Não existe ranking público com dados pessoais.
- Não foi encontrada publicidade comportamental direcionada a crianças.

Ponto de atenção: painel admin lista crianças e responsáveis para operação interna. Em produção, esse acesso deve ser restrito por autenticação admin robusta e logs de auditoria.

## 6. Conteúdo completo das conversas infantis no painel admin

Status: OK.

- `GET /api/admin/conversations` seleciona apenas metadados:
  - id
  - criança
  - responsável
  - modo
  - idioma
  - nível
  - data
- A rota não seleciona `userMessage` nem `aiResponse`.
- A página `/admin/conversas` exibe aviso de privacidade e não mostra o conteúdo das conversas.

Observação: o histórico completo ainda é retornado para a própria tela `/conversa` da criança/responsável via `/api/ai/conversations`.

## 7. Webhook Stripe validando assinatura

Status: OK.

- `POST /api/payments/webhook` lê o corpo bruto com `request.text()`.
- Usa `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)`.
- Usa `STRIPE_WEBHOOK_SECRET`.
- Processa `checkout.session.completed` para liberar assinatura.
- Eventos de expiração/falha atualizam Payment quando possível.

Ponto de atenção: em produção, configurar o endpoint real da Vercel no painel Stripe e conferir se o webhook secret corresponde ao ambiente correto.

## 8. Áudio bruto da criança

Status: OK no comportamento atual.

- A rota `/api/ai/voice-chat` recebe o arquivo, converte para base64 em memória e envia para transcrição.
- O áudio bruto não é salvo no banco.
- O áudio da resposta também não é salvo em storage.
- No banco, `AiConversation` salva apenas:
  - `userMessage` com a transcrição
  - `aiResponse`
  - `mode: VOICE`
  - `audioUrl: null`

Ponto de atenção: transcrições de voz ainda são dados pessoais/educacionais e devem ser tratadas como conteúdo sensível no desenho de retenção.

## 9. Logs sem dados sensíveis

Status: atenção necessária.

- A maioria dos logs registra mensagens genéricas de erro.
- O webhook Stripe registra metadata de checkout, incluindo ids internos, `finalPrice`, Stripe customer/subscription ids e payment id.
- Não foi encontrado log explícito de senha, `passwordHash`, áudio bruto ou texto de conversa infantil.

Recomendação para produção: reduzir logs com IDs pessoais/financeiros, usar níveis de log, evitar imprimir objetos completos de erros de provedores e centralizar logging com mascaramento.

## 10. Exclusão de conta

Status atual: manual.

- Foi criado o fluxo de `PrivacyRequest`.
- O perfil permite solicitar:
  - correção dos dados
  - exclusão da conta
  - exclusão dos dados da criança
- A API registra a solicitação como pendente.
- A página admin `/admin/privacidade` lista as solicitações.
- Nenhuma exclusão automática é executada no MVP.

Ponto de atenção: para produção, definir procedimento operacional, prazos, confirmação de identidade do responsável, registros de atendimento e critérios de retenção mínima.

## 11. Pontos pendentes para produção real

1. Implementar autenticação server-side robusta com cookie seguro ou JWT assinado.
2. Proteger todas as APIs `/api/admin/*` no backend, não apenas as páginas.
3. Implementar controle de sessão com expiração e logout server-side.
4. Adicionar rate limit nas APIs de login, IA, voz, benefícios, pagamentos e privacidade.
5. Validar e higienizar entradas com biblioteca de schema, como Zod, em todas as APIs.
6. Revisar logs para remover identificadores desnecessários e objetos completos de erro.
7. Definir política formal de retenção para conversas textuais e transcrições de voz.
8. Criar fluxo operacional real para exclusão/correção de dados.
9. Implementar auditoria de ações admin, especialmente em benefícios, pagamentos e privacidade.
10. Configurar headers de segurança, CSP e políticas de privacidade para produção.
11. Confirmar contratos/DPA com provedores: Vercel/hospedagem, Supabase, Stripe e provedor de IA.
12. Revisar textos legais com profissional jurídico antes de lançamento público.
13. Garantir segregação de ambientes: desenvolvimento, homologação e produção.
14. Configurar backups, plano de resposta a incidente e rotação de chaves.
15. Revisar consentimentos e bases legais para crianças com orientação jurídica especializada.

## Conclusão

O app está em bom estado para MVP técnico controlado, com cuidados importantes já implementados: secrets fora do Git, hash de senha no backend, webhook Stripe assinado, painel admin sem conteúdo integral de conversas e solicitações de privacidade manuais.

Para produção real, a maior pendência técnica é fortalecer autenticação/autorização no servidor, especialmente nas APIs admin, além de formalizar retenção, logs, auditoria e processo de privacidade.
