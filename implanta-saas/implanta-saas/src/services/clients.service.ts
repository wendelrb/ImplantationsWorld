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

export async function updateClient(
  id: string,
  updates: Partial<Omit<Client, "id" | "organization_id">>
) {
  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
