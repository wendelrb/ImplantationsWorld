import { useEffect, useState } from "react";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import {
  listTemplates,
  getTemplateWithModules,
  createTemplate,
  deleteTemplate,
  addModule,
  deleteModule,
  addTask,
  deleteTask,
} from "@/services/templates.service";
import { cn } from "@/lib/utils";

type TemplateListItem = { id: string; name: string; description?: string | null; template_modules: { id: string }[] };
type TemplateDetail = Awaited<ReturnType<typeof getTemplateWithModules>>;

export default function Templates() {
  const { organizationId } = useOrganization();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newModuleName, setNewModuleName] = useState("");
  const [newTaskName, setNewTaskName] = useState<Record<string, string>>({});

  async function refreshTemplates() {
    if (!organizationId) return;
    const data = await listTemplates(organizationId);
    setTemplates(data);
  }

  async function refreshDetail(templateId: string) {
    const data = await getTemplateWithModules(templateId);
    setDetail(data);
  }

  useEffect(() => {
    if (!organizationId) return;
    refreshTemplates().finally(() => setLoading(false));
  }, [organizationId]);

  useEffect(() => {
    if (selectedId) refreshDetail(selectedId);
    else setDetail(null);
  }, [selectedId]);

  async function handleCreateTemplate() {
    if (!organizationId || !newTemplateName.trim()) return;
    const created = await createTemplate({ organizationId, name: newTemplateName.trim() });
    setNewTemplateName("");
    await refreshTemplates();
    setSelectedId(created.id);
  }

  async function handleDeleteTemplate(id: string) {
    await deleteTemplate(id);
    if (selectedId === id) setSelectedId(null);
    await refreshTemplates();
  }

  async function handleAddModule() {
    if (!selectedId || !newModuleName.trim() || !detail) return;
    const position = detail.template_modules.length + 1;
    await addModule({ templateId: selectedId, name: newModuleName.trim(), position });
    setNewModuleName("");
    await refreshDetail(selectedId);
  }

  async function handleDeleteModule(moduleId: string) {
    if (!selectedId) return;
    await deleteModule(moduleId);
    await refreshDetail(selectedId);
  }

  async function handleAddTask(moduleId: string, existingTaskCount: number) {
    const name = (newTaskName[moduleId] ?? "").trim();
    if (!selectedId || !name) return;
    await addTask({ moduleId, name, position: existingTaskCount + 1 });
    setNewTaskName((prev) => ({ ...prev, [moduleId]: "" }));
    await refreshDetail(selectedId);
  }

  async function handleDeleteTask(taskId: string) {
    if (!selectedId) return;
    await deleteTask(taskId);
    await refreshDetail(selectedId);
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Templates de implantação</h1>
      <p className="mb-6 text-sm text-slate-500">
        Monte um cronograma reutilizável uma vez — cada implantação nova copia os módulos e
        tarefas daqui, sem afetar o template original.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Lista de templates */}
        <div>
          <div className="mb-3 flex gap-2">
            <input
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTemplate()}
              placeholder="Nome do novo template"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleCreateTemplate}
              className="shrink-0 rounded-md bg-brand-600 px-3 py-2 text-white hover:bg-brand-900"
              aria-label="Criar template"
            >
              <Plus size={16} />
            </button>
          </div>

          {loading && <p className="text-sm text-slate-500">Carregando...</p>}

          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm",
                  selectedId === t.id
                    ? "border-brand-500 bg-brand-50 text-brand-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                )}
              >
                <span className="flex items-center gap-2">
                  <ClipboardList size={16} />
                  {t.name}
                </span>
                <span className="text-xs text-slate-400">{t.template_modules.length} módulos</span>
              </button>
            ))}
          </div>

          {!loading && templates.length === 0 && (
            <p className="text-sm text-slate-400">Nenhum template ainda. Crie o primeiro acima.</p>
          )}
        </div>

        {/* Editor do template selecionado */}
        <div>
          {!detail && (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 p-12 text-sm text-slate-400">
              Selecione ou crie um template pra editar os módulos e tarefas.
            </div>
          )}

          {detail && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-slate-900">{detail.name}</h2>
                <button
                  onClick={() => handleDeleteTemplate(detail.id)}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                >
                  <Trash2 size={14} /> Excluir template
                </button>
              </div>

              <div className="space-y-4">
                {detail.template_modules.map((mod) => (
                  <div key={mod.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">{mod.name}</h3>
                      <button
                        onClick={() => handleDeleteModule(mod.id)}
                        className="text-slate-400 hover:text-red-600"
                        aria-label="Excluir módulo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <ul className="mb-3 space-y-1">
                      {mod.template_tasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-center justify-between rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          {task.name}
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-slate-300 hover:text-red-600"
                            aria-label="Excluir tarefa"
                          >
                            <Trash2 size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>

                    <div className="flex gap-2">
                      <input
                        value={newTaskName[mod.id] ?? ""}
                        onChange={(e) =>
                          setNewTaskName((prev) => ({ ...prev, [mod.id]: e.target.value }))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddTask(mod.id, mod.template_tasks.length)
                        }
                        placeholder="Nova tarefa"
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleAddTask(mod.id, mod.template_tasks.length)}
                        className="shrink-0 rounded-md border border-slate-200 px-2 text-slate-500 hover:bg-slate-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
                    placeholder="Novo módulo (ex: Treinamento)"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleAddModule}
                    className="shrink-0 rounded-md border border-slate-300 px-3 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    + módulo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
