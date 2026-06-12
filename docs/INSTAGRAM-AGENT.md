# Agente Instagram — Mais Acrílicos

Sistema de gestão e automação de conteúdo para [@maisacrilicos](https://instagram.com/maisacrilicos), usando apenas caminhos seguros (Meta Graph API oficial).

> **Produção:** veja [INSTAGRAM-PRODUCTION.md](./INSTAGRAM-PRODUCTION.md) para checklist completo de deploy.

## Etapas de implementação

| Etapa | Status | Entregáveis |
|-------|--------|-------------|
| 1 | ✅ Concluída | Dashboard, banco de dados, cadastro da marca |
| 2 | ✅ Concluída | Gerador de ideias, legendas A/B, calendário semanal, módulo crítico |
| 3 | ✅ Concluída | Upload, biblioteca, prompts de imagem e carrosséis |
| 4 | ✅ Concluída | Aprovação, edição final e agendamento interno |
| 5 | ✅ Concluída | Integração Meta Graph API (publicação segura) |
| 6 | ✅ Concluída | Métricas, aprendizado e melhoria automática |

## Instalação (Etapa 1)

### 1. Variáveis de ambiente

Copie `.env.example` para `.env` e configure `DATABASE_URL`, `JWT_SECRET` e credenciais admin.

### 2. Banco de dados

```bash
npm install
npx prisma migrate dev --name instagram_agent
npm run db:seed
```

### 3. Acessar o painel

```bash
npm run dev
```

- CMS geral: [http://localhost:3000/admin](http://localhost:3000/admin)
- Agente Instagram: [http://localhost:3000/admin/instagram](http://localhost:3000/admin/instagram)
- Cadastro da marca: [http://localhost:3000/admin/instagram/marca](http://localhost:3000/admin/instagram/marca)

## Modos de operação

### Modo 1 — Seguro (padrão)

- Agente cria ideias, legendas, prompts e calendário
- **Nada é publicado** sem aprovação manual
- Recomendado para início e testes

### Modo 2 — Automático autorizado (Etapa 5)

- Exige `INSTAGRAM_AUTO_PUBLISH=true` **e** auto publish ligado no painel Meta
- Modo Meta **ATIVO** (TESTE nunca publica de verdade)
- Publica apenas posts `SCHEDULED` com `scheduledFor <= agora`
- Feed com imagem única HTTPS pública + legenda final
- Carrossel, Stories e Reels: **não publicados automaticamente** nesta versão

## Modelos de banco (Prisma)

- `InstagramBrandConfig` — identidade da marca
- `InstagramPersona` — personas de público
- `InstagramCampaign` — campanhas
- `InstagramPost` — posts com status no pipeline
- `InstagramCaption` — legendas (variações A/B)
- `InstagramImagePrompt` — prompts para IA
- `InstagramImage` — imagens reais e geradas
- `EditorialCalendarEntry` — calendário editorial
- `InstagramMetric` — métricas de desempenho
- `InstagramApproval` — histórico de aprovações
- `PublicationLog` — logs de criação/publicação
- `InstagramService` — produtos/serviços para o agente

## Etapa 5 — Meta Graph API

### Página de configuração

- `/admin/instagram/meta` — IDs, token (mascarado), modo DESATIVADO / TESTE / ATIVO, auto publish

### Criar app Meta

1. Acesse [developers.facebook.com](https://developers.facebook.com) → **Criar app** → tipo Business
2. Adicione produto **Instagram Graph API**
3. Vincule a **Página do Facebook** da Mais Acrílicos
4. Conta Instagram deve ser **Profissional (Business/Creator)** e vinculada à página
5. Em **Ferramentas** → Graph API Explorer, gere token com permissões:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
6. Troque por token de longa duração (60 dias) via endpoint OAuth ou Business login
7. Anote **Page ID**, **Instagram Business Account ID** (não confundir com @username)

### Variáveis `.env` (servidor)

```env
META_GRAPH_API_VERSION=v23.0
META_APP_ID=
META_APP_SECRET=
META_PAGE_ID=
META_IG_BUSINESS_ACCOUNT_ID=
META_ACCESS_TOKEN=
INSTAGRAM_AUTO_PUBLISH=false
NEXT_PUBLIC_SITE_URL=https://www.maisacrilicos.com.br
```

Token pode ser salvo no painel (criptografado no banco) ou apenas no `.env`. **Nunca** aparece completo no front-end.

### Testar sem publicar

1. Configure token e IDs em `/admin/instagram/meta`
2. Defina modo **TESTE**
3. Aprove um post Feed com imagem em `/uploads/...` e legenda final
4. Clique **Publicar agora via Meta API** — registra log `meta_publish_test_mode`, **não** chama `media_publish`
5. Use **Testar conexão Meta** para validar token e @username

### Publicação real com segurança

1. Valide 3+ posts em modo TESTE
2. Confirme `NEXT_PUBLIC_SITE_URL` aponta para domínio HTTPS onde as imagens são públicas (Meta não acessa `localhost`)
3. Altere modo para **ATIVO**
4. Use **Publicar agora** em um post APPROVED com confirmação
5. Só então ligue auto publish: painel + `INSTAGRAM_AUTO_PUBLISH=true`

### Job automático (cron futuro)

```http
POST /api/admin/instagram/publish/run-due?limit=5
Header: x-cron-secret: <META_PUBLISH_CRON_SECRET>
```

Ou sessão admin autenticada. Rate limit: 1 execução / 60s.

**Vercel Cron** (exemplo `vercel.json`):

```json
{
  "crons": [{ "path": "/api/admin/instagram/publish/run-due", "schedule": "*/15 * * * *" }]
}
```

Configure `META_PUBLISH_CRON_SECRET` e envie no header via middleware ou use GitHub Actions.

### Limitações atuais (Etapa 5)

- Apenas **Feed com imagem única**
- Carrossel: estrutura preparada, publicação automática bloqueada
- Stories/Reels: `UNSUPPORTED_BY_CURRENT_IMPLEMENTATION`
- Imagens devem ser URL HTTPS pública (produção ou túnel ngrok em dev)
- Token expira — renove manualmente (refresh automático na Etapa futura)

### Checklist — Conectar Instagram

- [ ] Conta Instagram **Business** ou **Creator**
- [ ] Conta vinculada a uma **Página do Facebook**
- [ ] App criado em [developers.facebook.com](https://developers.facebook.com)
- [ ] Permissões: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
- [ ] Token de longa duração (nunca expor no front-end)
- [ ] `META_PAGE_ID` e `META_IG_BUSINESS_ACCOUNT_ID` no `.env` ou painel
- [ ] Testar em modo **TESTE** antes de **ATIVO**
- [ ] Manter auto publish desligado até validar publicações manuais

## Segurança

- Tokens Meta apenas em variáveis de ambiente no servidor
- JWT httpOnly para sessão admin
- `PublicationLog` registra todas as ações
- Sem Selenium, scraping ou automação proibida
- Publicação bloqueada sem status `APPROVED`

## Etapa 4 — Aprovação e agendamento

### Página

- `/admin/instagram/aprovacao` — fila com aprovar, reprovar, editar, agendar, publicação manual

### Regras de segurança

- Legenda final obrigatória para aprovar
- Score &lt; 65 exige confirmação extra
- Sem imagem/carrossel exige confirmação extra
- Reprovação exige motivo (mín. 10 caracteres)
- Agendamento só com data futura
- Publicação manual registrada em log — **não usa API do Instagram**

### Fluxo

1. Post em `PENDING_APPROVAL` → revisar na fila
2. **Editar final** → ajustar legenda, CTA, hashtags
3. **Aprovar** → status `APPROVED`
4. **Agendar** → status `SCHEDULED` (fila interna)
5. Publicar no app Instagram manualmente → **Marcar como publicado manualmente**

## Etapa 3 — Imagens e carrosséis

### Páginas

- `/admin/instagram/imagens` — biblioteca com filtros e preview
- `/admin/instagram/imagens/upload` — upload de fotos reais
- Detalhe do post — imagens vinculadas, prompts IA, carrossel 6 slides

### Upload

Arquivos salvos em `public/uploads/instagram/` (URL pública `/uploads/instagram/...`).
Máximo 10MB, formatos JPEG/PNG/WebP.

### Carrossel

Estrutura automática: gancho → problema → solução → exemplo → benefício → CTA WhatsApp.
Exportável em JSON (PNG/PDF na etapa futura).

## Etapa 2 — Gerador de conteúdo

### Páginas

- `/admin/instagram/posts` — gerar ideias, listar posts, gerar legendas
- `/admin/instagram/posts/[id]` — editar, legendas A/B, módulo crítico
- `/admin/instagram/calendario` — calendário semanal automático

### Fluxo

1. Configure a marca em `/admin/instagram/marca`
2. Gere ideias em **Posts** ou calendário completo em **Calendário**
3. Clique em **Gerar legendas** — cria variações A/B + score comercial
4. Posts com score ≥ 65 vão para `PENDING_APPROVAL`
5. Selecione a legenda A ou B no detalhe do post

### Módulo crítico

Analisa automaticamente:

- Gancho forte na primeira linha
- CTA para WhatsApp/orçamento
- Benefício claro para o lojista
- Prova social ou urgência
- Se o post é vendedor vs. só institucional

## APIs internas (admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/PUT | `/api/admin/instagram/brand` | Configuração da marca |
| POST | `/api/admin/instagram/personas` | Criar persona |
| PUT/DELETE | `/api/admin/instagram/personas/[id]` | Editar/remover persona |
| GET | `/api/admin/instagram/stats` | Estatísticas do dashboard |
| GET/POST | `/api/admin/instagram/posts` | Listar / gerar ideias |
| GET/PUT/DELETE | `/api/admin/instagram/posts/[id]` | CRUD de post |
| POST | `/api/admin/instagram/posts/[id]/generate` | Legendas + crítica |
| POST | `/api/admin/instagram/generate/calendar` | Calendário semanal |
| GET | `/api/admin/instagram/calendar` | Entradas do calendário |
| GET | `/api/admin/instagram/images` | Listar biblioteca |
| POST | `/api/admin/instagram/images/upload` | Upload multipart |
| GET/PUT/DELETE | `/api/admin/instagram/images/[id]` | Ver/editar/arquivar |
| POST | `/api/admin/instagram/images/[id]/archive` | Arquivar imagem |
| GET/POST/DELETE | `/api/admin/instagram/posts/[id]/images` | Vincular imagens |
| GET/POST | `/api/admin/instagram/posts/[id]/prompts` | Prompts de IA |
| GET/POST/PUT | `/api/admin/instagram/posts/[id]/carousel` | Carrossel |
| GET | `/api/admin/instagram/services` | Serviços para tags |
| GET | `/api/admin/instagram/approval` | Fila de aprovação |
| POST | `/api/admin/instagram/posts/[id]/approve` | Aprovar |
| POST | `/api/admin/instagram/posts/[id]/reject` | Reprovar |
| POST | `/api/admin/instagram/posts/[id]/request-adjustments` | Solicitar ajustes |
| PUT | `/api/admin/instagram/posts/[id]/final` | Edição final |
| POST/DELETE | `/api/admin/instagram/posts/[id]/schedule` | Agendar / cancelar |
| POST | `/api/admin/instagram/posts/[id]/manual-publish` | Publicação manual (app Instagram) |
| GET/PUT | `/api/admin/instagram/meta` | Configuração Meta (token mascarado) |
| POST | `/api/admin/instagram/meta/validate` | Testar conexão Graph API |
| GET/POST | `/api/admin/instagram/posts/[id]/publish-meta` | Elegibilidade / publicar via Meta |
| POST | `/api/admin/instagram/publish/run-due` | Job de posts agendados vencidos |
| GET | `/api/admin/instagram/metrics` | Métricas de posts publicados |
| GET | `/api/admin/instagram/metrics/posts/[id]` | Histórico + score híbrido |
| POST | `/api/admin/instagram/metrics/posts/[id]/sync` | Sincronizar um post |
| POST | `/api/admin/instagram/metrics/sync` | Job de sincronização em lote |
| GET | `/api/admin/instagram/performance/dashboard` | Dashboard de performance |
| POST | `/api/admin/instagram/performance/analyze` | Rodar análise completa |
| GET | `/api/admin/instagram/performance/recommendations` | Recomendações do agente |
| GET | `/api/admin/instagram/performance/alerts` | Alertas operacionais |
| GET | `/api/admin/instagram/posts/[id]/logs` | Logs e aprovações |

## Etapa 6 — Métricas e aprendizado

### Página

- `/admin/instagram/performance` — dashboard, rankings, alertas e recomendações

### Sincronizar métricas

1. Posts devem estar `PUBLISHED` com `instagramMediaId` (publicados via Meta API)
2. Clique **Sincronizar métricas** no dashboard ou no detalhe do post
3. Job em lote: `POST /api/admin/instagram/metrics/sync?limit=10` (admin ou `x-cron-secret`)

### Métricas da Meta (quando disponíveis)

| Métrica | Fonte | Observação |
|---------|-------|------------|
| Alcance, impressões/views | Insights API | `views` substitui `impressions` em alguns tipos |
| Curtidas, comentários | Campos do media object | Sempre que a API permitir |
| Salvamentos, compartilhamentos | Insights | Pode falhar por tipo de mídia |
| Visitas ao perfil | Insights | Nem sempre disponível |
| Cliques em link | Insights | Stories/links; Feed geralmente null |
| WhatsApp / orçamentos | — | **Não fornecido pela Meta** — exibido como indisponível |

Métricas negadas pela API ficam `null` e entram em `unavailableMetrics` — nunca inventadas.

### Score híbrido

- **Previsto:** score comercial do módulo crítico (Etapa 2)
- **Real:** derivado da taxa de engajamento vs média da conta
- **Híbrido:** 40% previsto + 60% real
- **Delta:** real − previsto (alerta se previsto alto e real baixo)

### Testar sem dados reais

1. Marque posts como `PUBLISHED` (ou publique em modo TESTE e depois ajuste status para testes internos)
2. Defina `INSTAGRAM_METRICS_DEMO=true` no `.env`
3. No dashboard, clique **Carregar demo (dev)** — gera métricas fictícias **sem chamar Meta**
4. Análise, rankings e recomendações funcionam com esses dados

### Interpretar recomendações

- **Repita** — temas/formatos com engajamento acima da média
- **Evite** — temas repetidos com baixo engajamento
- **CTA / horário / visual** — padrões detectados nos posts com métricas
- **Revisar critério** — score comercial alto mas performance real fraca

### Limitações

- Insights exigem permissão `instagram_manage_insights` ou equivalente no token
- Métricas demoram a aparecer após publicação (até 24–48h em alguns casos)
- Comparativo carrossel vs feed só com ambos publicados e sincronizados
- Orçamentos reais (WhatsApp) não vêm da API — use engajamento em posts com CTA wa.me como proxy
