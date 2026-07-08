-- Acesso público à página de status: em vez de uma policy de RLS na
-- tabela `implementations` (que arriscaria vazar linhas de outros
-- tenants pra quem só tem a anon key), expomos uma function security
-- definer que exige o token exato. A tabela em si continua sem
-- nenhuma policy pública — só esta function tem uma porta de saída.

create or replace function get_implementation_status(p_token uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', i.id,
    'name', i.name,
    'status', i.status,
    'client_name', c.name,
    'expected_completion', i.expected_completion,
    'modules', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id,
        'name', m.name,
        'position', m.position,
        'status', m.status,
        'tasks', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', t.id,
            'name', t.name,
            'status', t.status,
            'position', t.position
          ) order by t.position), '[]'::jsonb)
          from implementation_tasks t
          where t.module_id = m.id
        )
      ) order by m.position), '[]'::jsonb)
      from implementation_modules m
      where m.implementation_id = i.id
    )
  )
  from implementations i
  join clients c on c.id = i.client_id
  where i.public_token = p_token;
$$;

-- Aviso esperado do advisor de segurança do Supabase: esta function é
-- SECURITY DEFINER e executável por `anon` — isso é intencional. A
-- proteção não é "ninguém pode chamar", é "só retorna dado se você
-- souber o token" (mesmo modelo de um link "qualquer um com o link"
-- do Google Docs — UUID de 128 bits, impossível de adivinhar).
grant execute on function get_implementation_status(uuid) to anon;
