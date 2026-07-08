# Implanta SaaS

Ponto de partida do produto: gestão de implantação B2B multi-tenant, com portal
público de status e notificação nativa via WhatsApp (Evolution API) como
principal diferencial frente a concorrentes (ImplantaWeb, GuideCx, Rocketlane).

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (Postgres + Auth + RLS)
- Evolution API (WhatsApp)

## Estrutura de pastas

```
src/
  components/
    layout/          AppShell, Sidebar — casca da área logada
    implementations/ Componentes específicos do domínio "implantação"
    shared/           Componentes pequenos reutilizáveis (StatusBadge, etc)
    ui/               Reservado para primitives (shadcn/ui), se adotar depois
  config/
    supabase.ts       Client do Supabase
  contexts/
    AuthContext.tsx   Sessão + organization_id do usuário logado
  hooks/
    useOrganization.ts
  lib/
    utils.ts          Helpers genéricos (ex: cn para Tailwind)
    whatsapp.ts        Integração Evolution API — o diferencial do produto
  pages/
    auth/             Login (rota pública, sem AppShell)
    app/              Páginas internas (dashboard, implantações, clientes, templates)
    public/           PublicStatus — página pública sem login (/status/:token)
  services/
    *.service.ts      Camada de acesso a dados — um arquivo por domínio,
                       nada de query solta dentro de componente
  types/
    domain.ts         Tipos que espelham o schema do banco
supabase/
  migrations/
    0001_init_schema.sql   Schema completo, multi-tenant, com RLS
```

## Por que essa organização

- **`services/` separado de `components/`**: nenhuma chamada direta ao
  Supabase dentro de componente. Facilita trocar de Supabase pra outra
  coisa depois, e facilita testar a lógica sem montar UI.
- **`pages/public/` isolado de `pages/app/`**: a página de status público
  nunca deve acidentalmente herdar lógica de autenticação/AppShell.
  É o link que vai pro WhatsApp do cliente final — precisa funcionar
  sem sessão.
- **`custom_fields` (JSONB) no schema, não colunas fixas**: é o que
  permite vender pra ramos diferentes sem migração de banco a cada
  cliente novo.

## Primeiros passos

1. Criar projeto no Supabase e rodar a migration:
   ```
   supabase db push
   ```
   (ou colar o conteúdo de `supabase/migrations/0001_init_schema.sql`
   direto no SQL editor do painel do Supabase)

2. Copiar `.env.example` para `.env` e preencher:
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — em Project Settings > API
   - `VITE_EVOLUTION_API_URL` / `VITE_EVOLUTION_API_KEY` / `VITE_EVOLUTION_INSTANCE`

3. Instalar e rodar:
   ```
   npm install
   npm run dev
   ```

## O que falta (intencionalmente deixado como TODO)

- Autenticação real com `org_id` no JWT (custom claim via Supabase Auth Hook)
- RPC no Postgres pra copiar template → implantação numa transação só
  (hoje só cria o registro raiz, ver TODO em `implementations.service.ts`)
- Mover o envio de WhatsApp pra uma Edge Function (nunca expor a API key
  da Evolution no client em produção)
- Passe de identidade visual real (cores, tipografia) — o que está aqui
  é só estrutura, não a versão final de design
- CRUD completo de templates com drag-and-drop de módulos/tarefas
