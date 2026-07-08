import { supabase } from "@/config/supabase";
import type { Client } from "@/types/domain";

export async function listClients(organizationId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) throw error;
  return data as Client[];
}

export async function createClient(
  client: Omit<Client, "id">
) {
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}
