import { supabase } from "@/config/supabase";

export async function listImplementations(organizationId: string) {
  const { data, error } = await supabase
    .from("implementations")
    .select("*, clients(name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Cria a implantação chamando a function do banco que copia
// módulos/tarefas do template de forma atômica (ver
// supabase/migrations/0003_create_implementation_from_template.sql).
// Substituiu a versão anterior que só criava o registro raiz.
export async function createImplementationFromTemplate(params: {
  organizationId: string;
  clientId: string;
  templateId: string;
  name: string;
}) {
  const { organizationId, clientId, templateId, name } = params;

  const { data: implementationId, error } = await supabase.rpc(
    "create_implementation_from_template",
    {
      p_organization_id: organizationId,
      p_client_id: clientId,
      p_template_id: templateId,
      p_name: name,
    }
  );

  if (error) throw error;
  return implementationId as string;
}

// Usado pela página pública de status — chama a function
// `get_implementation_status` (ver supabase/migrations/0002_public_status_rpc.sql)
// em vez de selecionar a tabela direto. A tabela `implementations` não
// tem policy pública nenhuma; só essa function, que exige o token exato,
// tem permissão de leitura pro papel `anon`.
export async function getImplementationByPublicToken(token: string) {
  const { data, error } = await supabase.rpc("get_implementation_status", {
    p_token: token,
  });

  if (error) throw error;
  if (!data) throw new Error("Implantação não encontrada para este link.");
  return data as {
    id: string;
    name: string;
    status: string;
    client_name: string;
    expected_completion: string | null;
    modules: Array<{
      id: string;
      name: string;
      position: number;
      status: string;
      tasks: Array<{ id: string; name: string; status: string; position: number }>;
    }>;
  };
}
