# Mais Acrílicos — Site Premium

Site institucional e CMS para a [Mais Acrílicos](https://www.maisacrilicos.com.br), fabricante de comunicação visual e materiais de PDV.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **PostgreSQL** + **Prisma**
- Blog com CMS próprio
- SEO avançado (Schema.org, Open Graph, Sitemap, Robots)

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Home premium com hero, produtos e segmentos |
| `/produtos` | Catálogo de produtos |
| `/segmentos` | Segmentos atendidos |
| `/portfolio` | Portfólio de projetos |
| `/blog` | Blog com artigos SEO |
| `/contato` | Formulário de orçamento |
| `/admin` | Painel administrativo (CMS) |

## Configuração

### 1. Variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mais_acrilicos"
ADMIN_EMAIL="admin@maisacrilicos.com.br"
ADMIN_PASSWORD="sua-senha-segura"
JWT_SECRET="chave-secreta-minimo-32-caracteres"
NEXT_PUBLIC_SITE_URL="https://www.maisacrilicos.com.br"
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_CLARITY_ID="xxxxxxxxxx"
NEXT_PUBLIC_GSC_VERIFICATION="codigo-google-search-console"
NEXT_PUBLIC_WHATSAPP="5511999999999"
```

### 2. Banco de dados

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
```

### 3. Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### 4. Painel Admin

Acesse [http://localhost:3000/admin](http://localhost:3000/admin) com as credenciais do `.env`.

## Funcionalidades

### SEO
- Google Analytics (GA4)
- Microsoft Clarity
- Google Search Console (meta verification)
- `sitemap.xml` dinâmico
- `robots.txt`
- Schema.org (Organization, LocalBusiness, Article, Product, Breadcrumb, FAQ)
- Open Graph e Twitter Cards

### Blog & CMS
- CRUD completo de posts
- Categorias e tags
- Campos SEO (meta title, description, keywords)
- Editor HTML

### Gerador de Artigos SEO
- Fila pré-configurada com 200+ keywords
- Geração automática por templates
- Publicação em lote pelo painel admin (`/admin/seo`)

### Leads
- Formulário de orçamento com validação
- Botão WhatsApp fixo
- Painel de orçamentos no admin

## Deploy

```bash
npm run build
npm start
```

Configure `DATABASE_URL` e demais variáveis no ambiente de produção (Vercel, Railway, etc.).

## Lighthouse

O site foi otimizado para pontuação acima de 90:
- Imagens com `next/image` (AVIF/WebP)
- Fontes com `display: swap`
- Scripts de analytics com `afterInteractive`
- HTML semântico
- CSS minimalista com Tailwind
