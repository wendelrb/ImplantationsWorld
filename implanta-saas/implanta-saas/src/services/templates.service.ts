import { supabase } from "@/config/supabase";
import type { ScheduleTemplate, TemplateModule, TemplateTask } from "@/types/domain";

export async function listTemplates(organizationId: string) {
  const { data, error } = await supabase
    .from("schedule_templates")
    .select("*, template_modules(id)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as (ScheduleTemplate & { template_modules: { id: string }[] })[];
}

export async function getTemplateWithModules(templateId: string) {
  const { data, error } = await supabase
    .from("schedule_templates")
    .select("*, template_modules(*, template_tasks(*))")
    .eq("id", templateId)
    .single();

  if (error) throw error;

  // Ordena no client — evita depender de "order" aninhado em embeds do PostgREST.
  const modules = (data.template_modules ?? [])
    .slice()
    .sort((a: TemplateModule, b: TemplateModule) => a.position - b.position)
    .map((m: TemplateModule & { template_tasks: TemplateTask[] }) => ({
      ...m,
      template_tasks: (m.template_tasks ?? [])
        .slice()
        .sort((a: TemplateTask, b: TemplateTask) => a.position - b.position),
    }));

  return { ...data, template_modules: modules } as ScheduleTemplate & {
    template_modules: (TemplateModule & { template_tasks: TemplateTask[] })[];
  };
}

export async function createTemplate(params: {
  organizationId: string;
  name: string;
  description?: string;
}) {
  const { data, error } = await supabase
    .from("schedule_templates")
    .insert({
      organization_id: params.organizationId,
      name: params.name,
      description: params.description ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ScheduleTemplate;
}

export async function deleteTemplate(templateId: string) {
  const { error } = await supabase.from("schedule_templates").delete().eq("id", templateId);
  if (error) throw error;
}

export async function addModule(params: {
  templateId: string;
  name: string;
  position: number;
}) {
  const { data, error } = await supabase
    .from("template_modules")
    .insert({
      template_id: params.templateId,
      name: params.name,
      position: params.position,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TemplateModule;
}

export async function deleteModule(moduleId: string) {
  const { error } = await supabase.from("template_modules").delete().eq("id", moduleId);
  if (error) throw error;
}

export async function addTask(params: {
  moduleId: string;
  name: string;
  position: number;
  estimatedHours?: number;
}) {
  const { data, error } = await supabase
    .from("template_tasks")
    .insert({
      module_id: params.moduleId,
      name: params.name,
      position: params.position,
      estimated_hours: params.estimatedHours ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TemplateTask;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from("template_tasks").delete().eq("id", taskId);
  if (error) throw error;
}
