-- Copia módulos/tarefas do template pra implantação de forma atômica.
-- Faz isso em loop (não join por nome) pra garantir mapeamento correto
-- mesmo se dois módulos do mesmo template tiverem nomes iguais.
--
-- Nota de segurança: como ainda não temos o custom claim org_id no JWT
-- (ver TODO em AuthContext.tsx), esta function confia no organization_id
-- que o client envia — mesmo modelo de confiança que o resto do app hoje.
-- Quando o Auth Hook for implementado, adicionar aqui uma verificação de
-- que auth.uid() pertence de fato a p_organization_id.

create or replace function create_implementation_from_template(
  p_organization_id uuid,
  p_client_id uuid,
  p_template_id uuid,
  p_name varchar
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_implementation_id uuid;
  v_module record;
  v_new_module_id uuid;
begin
  insert into implementations (organization_id, client_id, template_id, name, status, started_at)
  values (p_organization_id, p_client_id, p_template_id, p_name, 'not_started', now())
  returning id into v_implementation_id;

  for v_module in
    select id, name, position from template_modules
    where template_id = p_template_id
    order by position
  loop
    insert into implementation_modules (implementation_id, name, position, status)
    values (v_implementation_id, v_module.name, v_module.position, 'pending')
    returning id into v_new_module_id;

    insert into implementation_tasks (module_id, name, position, status)
    select v_new_module_id, tt.name, tt.position, 'pending'
    from template_tasks tt
    where tt.module_id = v_module.id
    order by tt.position;
  end loop;

  return v_implementation_id;
end;
$$;

grant execute on function create_implementation_from_template(uuid, uuid, uuid, varchar) to authenticated;
