// Tipos de domínio — espelham o schema em supabase/migrations/0001_init_schema.sql.
// Depois que o schema estiver estável, considere gerar isso automaticamente com:
//   supabase gen types typescript --project-id <id> > src/types/database.types.ts

export type ImplementationStatus =
  | "not_started"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";

export type TaskStatus = "pending" | "in_progress" | "done";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "trial" | "starter" | "pro" | "enterprise";
  settings: Record<string, unknown>;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  custom_fields: Record<string, unknown>;
}

export interface ScheduleTemplate {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
}

export interface TemplateModule {
  id: string;
  template_id: string;
  name: string;
  position: number;
}

export interface TemplateTask {
  id: string;
  module_id: string;
  name: string;
  description?: string | null;
  position: number;
  estimated_hours?: number | null;
}

export interface Implementation {
  id: string;
  organization_id: string;
  client_id: string;
  template_id?: string | null;
  name: string;
  status: ImplementationStatus;
  assigned_agent_id?: string | null;
  public_token: string;
  started_at?: string | null;
  expected_completion?: string | null;
  completed_at?: string | null;
}

export interface ImplementationModule {
  id: string;
  implementation_id: string;
  name: string;
  position: number;
  status: TaskStatus;
}

export interface ImplementationTask {
  id: string;
  module_id: string;
  name: string;
  position: number;
  status: TaskStatus;
  assigned_to?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
}
