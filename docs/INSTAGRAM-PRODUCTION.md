# Checklist de produção — Agente Instagram

## Variáveis de ambiente obrigatórias

```env
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ caracteres aleatórios>
ADMIN_EMAIL=...
ADMIN_PASSWORD=<senha forte>
NEXT_PUBLIC_SITE_URL=https://www.maisacrilicos.com.br

# Meta
META_GRAPH_API_VERSION=v23.0
META_PAGE_ID=
META_IG_BUSINESS_ACCOUNT_ID=
META_ACCESS_TOKEN=
META_TOKEN_ENCRYPTION_KEY=<opcional mas recomendado>
INSTAGRAM_AUTO_PUBLISH=false

# Cron (se usar jobs)
META_PUBLISH_CRON_SECRET=<string longa aleatória>
META_METRICS_CRON_SECRET=<string longa aleatória>
```

**Nunca** commitar `.env`. **Nunca** habilitar `INSTAGRAM_METRICS_DEMO` em produção.

---

## Checklist Vercel / servidor

- [ ] `npm run build` passa
- [ ] `npm run instagram:validate` passa
- [ ] `npx prisma migrate deploy` no deploy
- [ ] `JWT_SECRET` forte configurado
- [ ] `INSTAGRAM_AUTO_PUBLISH=false` até validação manual
- [ ] `NEXT_PUBLIC_SITE_URL` = domínio HTTPS real
- [ ] Pasta `public/uploads/instagram/` persistente (ou migrar para S3/R2)
- [ ] Cron configurado (opcional): `POST /api/admin/instagram/metrics/sync` e `run-due`
- [ ] Logs da Vercel sem dump de variáveis

---

## Checklist PostgreSQL

- [ ] Backup automático habilitado
- [ ] Migrations aplicadas (6+ migrations Instagram)
- [ ] Conexão SSL em produção
- [ ] Apenas uma linha `InstagramBrandConfig` (single-tenant)

---

## Checklist storage HTTPS

- [ ] Imagens em `https://seu-dominio/uploads/instagram/...` acessíveis pela Meta
- [ ] `localhost` **não** funciona para publicação Meta
- [ ] Upload validado (JPEG/PNG/WebP por magic bytes)

---

## Checklist Meta App

- [ ] Instagram Business/Creator vinculado à Página Facebook
- [ ] Permissões: `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`
- [ ] Token longa duração no servidor
- [ ] Modo **TESTE** antes de **ATIVO**
- [ ] Data de expiração do token no painel Meta API

---

## Checklist cron (opcional)

```http
POST /api/admin/instagram/publish/run-due?limit=5
POST /api/admin/instagram/metrics/sync?limit=10
Header: x-cron-secret: <secret>
```

- [ ] Secrets diferentes para publish e metrics (recomendado)
- [ ] Auto publish só após 10+ posts manuais validados

---

## Checklist backup

- [ ] Backup diário PostgreSQL
- [ ] Backup de `public/uploads/instagram/` (ou object storage)
- [ ] Export periódico de `PublicationLog` para auditoria

---

## Teste ponta a ponta (produção)

1. Login admin → `/admin/instagram`
2. Checklist no dashboard → **Próximo passo**
3. Marca → gerar post → upload foto → aprovar → agendar
4. Meta modo TESTE → publicar (simulação)
5. Meta modo ATIVO → 1 post real
6. Performance → sincronizar métricas
7. Verificar recomendações e alertas

---

## O que NÃO automatizar ainda

- Carrossel via API
- Stories e Reels
- Auto publish sem supervisão
- Renovação automática de token (parcial)
- Métricas de WhatsApp/orçamento (não existem na Meta)

---

## Uso comercial — Mais Acrílicos

1. **Prova social:** posts com alto engajamento → cases no site
2. **CTA wa.me:** priorizar legendas que geram clique (proxy de orçamento)
3. **Serviços campeões:** campanhas dedicadas para displays/luminosos com melhor performance
4. **Rotina semanal:** segunda dica → terça produto → aprovação sexta → publicação terça 10h
5. **Registro manual de orçamentos** (próxima melhoria) para cruzar com posts
