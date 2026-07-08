import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/config/supabase";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  organizationId: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // org_id vem do app_metadata do usuário (Supabase inclui isso no JWT
  // automaticamente, sem precisar de Auth Hook). É setado pela function
  // `onboard_user_to_org` no banco quando um usuário novo é vinculado a
  // uma organização — ver supabase/migrations/0004_link_users_to_auth_and_fix_org_claim.sql.
  const organizationId = (session?.user?.app_metadata?.org_id as string) ?? null;

  return (
    <AuthContext.Provider value={{ session, loading, organizationId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
