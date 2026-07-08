import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Falha alto e cedo em dev — evita bug silencioso de client mal configurado.
  console.warn(
    "Supabase não configurado: preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
