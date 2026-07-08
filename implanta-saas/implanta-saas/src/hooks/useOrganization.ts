import { useAuth } from "@/contexts/AuthContext";

// Hook fino sobre o AuthContext — ponto único pra evoluir depois
// (ex: buscar dados completos da organização, não só o id).
export function useOrganization() {
  const { organizationId, loading } = useAuth();
  return { organizationId, loading };
}
