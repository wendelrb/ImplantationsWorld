import { supabase } from "@/config/supabase";

export interface OverdueTask {
  id: string;
  name: string;
  dueDate: string;
  implementationId: string;
  implementationName: string;
  daysLate: number;
}

export interface DashboardKpis {
  inProgressCount: number;
  completedThisMonthCount: number;
  overdueTasks: OverdueTask[];
}

// "Hoje" no fuso local, no formato date (YYYY-MM-DD) — evita que
// toISOString() (UTC) empurre a data pro dia seguinte perto da meia-noite.
function todayLocalDateString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function daysBetween(pastDate: string, todayDate: string) {
  const past = new Date(`${pastDate}T00:00:00Z`).getTime();
  const today = new Date(`${todayDate}T00:00:00Z`).getTime();
  return Math.round((today - past) / (1000 * 60 * 60 * 24));
}

export async function getDashboardKpis(organizationId: string): Promise<DashboardKpis> {
  const today = todayLocalDateString();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [inProgressRes, completedRes, overdueRes] = await Promise.all([
    supabase
      .from("implementations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "in_progress"),

    supabase
      .from("implementations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .gte("completed_at", startOfMonth),

    // Sem coluna organization_id direta em implementation_tasks — o
    // isolamento por org aqui vem só da RLS (mesmo modelo de
    // getImplementationDetail em implementations.service.ts).
    supabase
      .from("implementation_tasks")
      .select("id, name, due_date, implementation_modules(implementation_id, implementations(id, name))")
      .lt("due_date", today)
      .neq("status", "done")
      .order("due_date"),
  ]);

  if (inProgressRes.error) throw inProgressRes.error;
  if (completedRes.error) throw completedRes.error;
  if (overdueRes.error) throw overdueRes.error;

  const overdueTasks: OverdueTask[] = (overdueRes.data ?? []).map((task: any) => ({
    id: task.id,
    name: task.name,
    dueDate: task.due_date,
    implementationId: task.implementation_modules.implementations.id,
    implementationName: task.implementation_modules.implementations.name,
    daysLate: daysBetween(task.due_date, today),
  }));

  return {
    inProgressCount: inProgressRes.count ?? 0,
    completedThisMonthCount: completedRes.count ?? 0,
    overdueTasks,
  };
}
