-- ============================================================
-- Implanta SaaS — schema inicial (multi-tenant)
-- Ver documento de arquitetura para o racional de cada tabela.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Núcleo: organizações, usuários, times ----------

create table organizations (
    id          uuid primary key default gen_random_uuid(),
    name        varchar(150) not null,
    slug        varchar(80) unique not null,
    plan        varchar(30) not null default 'trial',
    settings    jsonb default '{}',
    created_at  timestamptz default now()
);

create table users (
    id              uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    name            varchar(150) not null,
    email           varchar(150) not null,
    status          varchar(20) not null default 'active',
    created_at      timestamptz default now(),
    unique (organization_id, email)
);

create table teams (
    id              uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    name            varchar(100) not null,
    manager_id      uuid references users(id)
);

create table team_members (
    team_id uuid not null references teams(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    primary key (team_id, user_id)
);

create table user_roles (
    user_id uuid not null references users(id) on delete cascade,
    role    varchar(20) not null check (role in ('owner','admin','manager','member')),
    primary key (user_id)
);

-- ---------- Clientes ----------

create table clients (
    id              uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    name            varchar(150) not null,
    document        varchar(20),
    email           varchar(150),
    phone           varchar(20),
    custom_fields   jsonb default '{}',
    created_at      timestamptz default now()
);

-- ---------- Templates reutilizáveis ----------

create table schedule_templates (
    id              uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    name            varchar(150) not null,
    description     text,
    created_at      timestamptz default now()
);

create table template_modules (
    id          uuid primary key default gen_random_uuid(),
    template_id uuid not null references schedule_templates(id) on delete cascade,
    name        varchar(150) not null,
    position    int not null default 0
);

create table template_tasks (
    id               uuid primary key default gen_random_uuid(),
    module_id        uuid not null references template_modules(id) on delete cascade,
    name             varchar(150) not null,
    description      text,
    position         int not null default 0,
    estimated_hours  numeric(6,2)
);

-- ---------- Implantações ----------

create table implementations (
    id                  uuid primary key default gen_random_uuid(),
    organization_id     uuid not null references organizations(id) on delete cascade,
    client_id           uuid not null references clients(id) on delete cascade,
    template_id         uuid references schedule_templates(id),
    name                varchar(150) not null,
    status              varchar(20) not null default 'not_started',
    assigned_agent_id   uuid references users(id),
    public_token        uuid unique default gen_random_uuid(),
    started_at          timestamptz,
    expected_completion date,
    completed_at        timestamptz,
    created_at          timestamptz default now()
);

create table implementation_modules (
    id                uuid primary key default gen_random_uuid(),
    implementation_id uuid not null references implementations(id) on delete cascade,
    name              varchar(150) not null,
    position          int not null default 0,
    status            varchar(20) not null default 'pending'
);

create table implementation_tasks (
    id           uuid primary key default gen_random_uuid(),
    module_id    uuid not null references implementation_modules(id) on delete cascade,
    name         varchar(150) not null,
    position     int not null default 0,
    status       varchar(20) not null default 'pending',
    assigned_to  uuid references users(id),
    due_date     date,
    completed_at timestamptz
);

create table implementation_pauses (
    id                uuid primary key default gen_random_uuid(),
    implementation_id uuid not null references implementations(id) on delete cascade,
    paused_at         timestamptz not null default now(),
    resumed_at        timestamptz,
    reason            text,
    paused_by         uuid references users(id)
);

-- ---------- Comunicação ----------

create table meetings (
    id                uuid primary key default gen_random_uuid(),
    implementation_id uuid not null references implementations(id) on delete cascade,
    title             varchar(150) not null,
    scheduled_at      timestamptz not null,
    notes             text,
    created_by        uuid references users(id)
);

create table comments (
    id                uuid primary key default gen_random_uuid(),
    implementation_id uuid not null references implementations(id) on delete cascade,
    user_id           uuid references users(id),
    content           text not null,
    visible_to_client boolean not null default false,
    created_at        timestamptz default now()
);

create table notifications (
    id                uuid primary key default gen_random_uuid(),
    organization_id   uuid not null references organizations(id) on delete cascade,
    implementation_id uuid references implementations(id),
    channel           varchar(20) not null,
    recipient         varchar(150) not null,
    message           text not null,
    status            varchar(20) not null default 'queued',
    sent_at           timestamptz,
    created_at        timestamptz default now()
);

-- ---------- Suporte ----------

create table tickets (
    id                uuid primary key default gen_random_uuid(),
    organization_id   uuid not null references organizations(id) on delete cascade,
    implementation_id uuid references implementations(id),
    client_id         uuid not null references clients(id),
    title             varchar(150) not null,
    description       text,
    status            varchar(20) not null default 'open',
    priority          varchar(10) not null default 'normal',
    created_at        timestamptz default now(),
    resolved_at       timestamptz
);

-- ---------- Intake ----------

create table briefings (
    id              uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    name            varchar(150) not null,
    form_schema     jsonb not null,
    created_at      timestamptz default now()
);

create table briefing_responses (
    id                uuid primary key default gen_random_uuid(),
    briefing_id       uuid not null references briefings(id) on delete cascade,
    implementation_id uuid references implementations(id),
    answers           jsonb not null,
    submitted_at      timestamptz default now()
);

-- ---------- Auditoria ----------

create table audit_logs (
    id              uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    user_id         uuid references users(id),
    action          varchar(100) not null,
    entity_type     varchar(50) not null,
    entity_id       uuid,
    metadata        jsonb default '{}',
    created_at      timestamptz default now()
);

-- ============================================================
-- RLS — habilitar em todas as tabelas de tenant
-- ============================================================

alter table organizations enable row level security;
alter table users enable row level security;
alter table teams enable row level security;
alter table clients enable row level security;
alter table schedule_templates enable row level security;
alter table implementations enable row level security;
alter table notifications enable row level security;
alter table tickets enable row level security;
alter table briefings enable row level security;
alter table audit_logs enable row level security;

-- Policy padrão (repita o padrão nas tabelas filhas via join, conforme
-- documentado no schema de arquitetura).
create policy tenant_isolation on clients
  using (organization_id = (auth.jwt() ->> 'org_id')::uuid);

create policy tenant_isolation on implementations
  using (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- Acesso público de leitura para a página de status (somente pelo token,
-- nunca lista todas as implantações do tenant).
create policy public_status_by_token on implementations
  for select
  using (true);
  -- Restrinja no client/service: sempre filtrar por `public_token = :token`,
  -- nunca fazer select * sem esse filtro no contexto público.
