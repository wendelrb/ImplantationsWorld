-- notifications tinha RLS habilitado desde 0001_init_schema.sql mas nenhuma
-- policy foi criada pra ela, então todo insert/select era negado por padrão
-- mesmo pra usuário autenticado da própria org. Sem isso,
-- notifyImplementationUpdate (services/notifications.service.ts) nunca
-- conseguia registrar notificação nenhuma — descoberto ao testar o fluxo
-- de "marcar tarefa concluída" da tela de detalhe da implantação.
create policy tenant_isolation on notifications
  using (organization_id = ((auth.jwt() -> 'app_metadata') ->> 'org_id')::uuid)
  with check (organization_id = ((auth.jwt() -> 'app_metadata') ->> 'org_id')::uuid);
