-- Liga public.users ao auth.users real (a tabela está vazia ainda, então
-- não há dado pra migrar). id deixa de ser autogerado — passa a ser
-- explicitamente o id do usuário de autenticação.
alter table users
  add constraint users_id_fkey foreign key (id) references auth.users(id) on delete cascade;
alter table users alter column id drop default;

-- Função de onboarding: cria o vínculo usuário -> organização de uma vez.
-- Uso: quando você (admin) cria a conta de um novo cliente/piloto, roda
-- isso passando o auth.users.id gerado no signup.
-- Não é exposta pra authenticated/anon -- só roda via SQL editor/service role.
create or replace function onboard_user_to_org(
  p_auth_user_id uuid,
  p_organization_id uuid,
  p_name varchar,
  p_email varchar,
  p_role varchar default 'member'
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, organization_id, name, email, status)
  values (p_auth_user_id, p_organization_id, p_name, p_email, 'active');

  insert into public.user_roles (user_id, role)
  values (p_auth_user_id, p_role);

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('org_id', p_organization_id::text)
  where id = p_auth_user_id;
end;
$$;

-- Corrige as policies pra ler de app_metadata (onde o AuthContext.tsx já
-- lê no frontend) em vez de um claim solto que nunca existiu de verdade.
drop policy if exists tenant_isolation on clients;
create policy tenant_isolation on clients
  using (organization_id = ((auth.jwt() -> 'app_metadata') ->> 'org_id')::uuid);

drop policy if exists tenant_isolation on implementations;
create policy tenant_isolation on implementations
  using (organization_id = ((auth.jwt() -> 'app_metadata') ->> 'org_id')::uuid);

drop policy if exists tenant_isolation on schedule_templates;
create policy tenant_isolation on schedule_templates
  using (organization_id = ((auth.jwt() -> 'app_metadata') ->> 'org_id')::uuid);

-- As tabelas filhas (template_modules/tasks, implementation_modules/tasks)
-- ainda não tinham nenhuma policy -- adiciono agora, via join até o dono.
create policy tenant_isolation on template_modules
  using (template_id in (
    select id from schedule_templates
    where organization_id = ((auth.jwt() -> 'app_metadata') ->> 'org_id')::uuid
  ));

create policy tenant_isolation on template_tasks
  using (module_id in (
    select tm.id from template_modules tm
    join schedule_templates st on st.id = tm.template_id
    where st.organization_id = ((auth.jwt() -> 'app_metadata') ->> 'org_id')::uuid
  ));

create policy tenant_isolation on implementation_modules
  using (implementation_id in (
    select id from implementations
    where organization_id = ((auth.jwt() -> 'app_metadata') ->> 'org_id')::uuid
  ));

create policy tenant_isolation on implementation_tasks
  using (module_id in (
    select im.id from implementation_modules im
    join implementations i on i.id = im.implementation_id
    where i.organization_id = ((auth.jwt() -> 'app_metadata') ->> 'org_id')::uuid
  ));
