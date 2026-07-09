-- Marca uma tarefa como concluída e recalcula, de forma atômica, o status
-- do módulo pai e da implantação — evita ter essa lógica espalhada no
-- client (e cada tela reimplementando a mesma regra de forma diferente).
--
-- Diferente de create_implementation_from_template (security definer):
-- aqui não precisa, porque quem chama já tem acesso direto de update nas
-- três tabelas via RLS (tenant_isolation, ver 0004). security invoker deixa
-- o Postgres aplicar essa mesma checagem dentro da function, sem abrir
-- privilégio extra.
create or replace function complete_task(p_task_id uuid)
returns implementation_tasks
language plpgsql
security invoker
as $$
declare
  v_task            implementation_tasks;
  v_module_id       uuid;
  v_implementation_id uuid;
  v_total_tasks     int;
  v_done_tasks      int;
  v_active_tasks    int;
  v_module_status   varchar(20);
  v_total_modules   int;
  v_done_modules    int;
  v_active_modules  int;
  v_current_impl_status varchar(20);
begin
  update implementation_tasks
  set status = 'done', completed_at = now()
  where id = p_task_id
  returning * into v_task;

  if v_task.id is null then
    raise exception 'Tarefa % não encontrada ou sem permissão de acesso', p_task_id;
  end if;

  v_module_id := v_task.module_id;

  select count(*),
         count(*) filter (where status = 'done'),
         count(*) filter (where status in ('done', 'in_progress'))
  into v_total_tasks, v_done_tasks, v_active_tasks
  from implementation_tasks
  where module_id = v_module_id;

  v_module_status := case
    when v_done_tasks = v_total_tasks then 'done'
    when v_active_tasks > 0 then 'in_progress'
    else 'pending'
  end;

  update implementation_modules
  set status = v_module_status
  where id = v_module_id
  returning implementation_id into v_implementation_id;

  select count(*),
         count(*) filter (where status = 'done'),
         count(*) filter (where status in ('done', 'in_progress'))
  into v_total_modules, v_done_modules, v_active_modules
  from implementation_modules
  where implementation_id = v_implementation_id;

  select status into v_current_impl_status
  from implementations
  where id = v_implementation_id;

  -- não sobrescreve pausada/cancelada — esses são estados manuais, não
  -- derivados do progresso das tarefas.
  if v_current_impl_status not in ('paused', 'cancelled') then
    update implementations
    set status = case
      when v_done_modules = v_total_modules then 'completed'
      when v_active_modules > 0 then 'in_progress'
      else 'not_started'
    end
    where id = v_implementation_id;
  end if;

  return v_task;
end;
$$;

revoke all on function complete_task(uuid) from public;
grant execute on function complete_task(uuid) to authenticated;
