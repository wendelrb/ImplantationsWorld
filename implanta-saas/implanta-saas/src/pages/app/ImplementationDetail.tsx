import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getImplementationDetail, completeTask } from "@/services/implementations.service";
import { notifyImplementationUpdate } from "@/services/notifications.service";
import { whatsappTemplates } from "@/lib/whatsapp";
import { useOrganization } from "@/hooks/useOrganization";
import type { ImplementationTask } from "@/types/domain";

type ImplementationDetailData = Awaited<ReturnType<typeof getImplementationDetail>>;

export default function ImplementationDetail() {
  const { id } = useParams();
  const { organizationId } = useOrganization();
  const [detail, setDetail] = useState<ImplementationDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!id) return;
    const data = await getImplementationDetail(id);
    setDetail(data);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [id]);

  async function handleCompleteTask(task: ImplementationTask) {
    if (!detail || !organizationId || task.status === "done") return;
    setError(null);
    setCompletingTaskId(task.id);
    try {
      await completeTask(task.id);
      if (detail.clients?.phone) {
        const linkStatus = `${window.location.origin}/status/${detail.public_token}`;
        await notifyImplementationUpdate({
          organizationId,
          implementationId: detail.id,
          phone: detail.clients.phone,
          message: whatsappTemplates.etapaConcluida(detail.clients.name, task.name, linkStatus),
        });
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao concluir tarefa.");
    } finally {
      setCompletingTaskId(null);
    }
  }

  if (loading) return <p className="text-slate-500">Carregando...</p>;
  if (!detail) return <p className="text-slate-500">Implantação não encontrada.</p>;

  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">{detail.name}</h1>
        <StatusBadge status={detail.status} />
      </div>
      <p className="mb-6 text-sm text-slate-500">Cliente: {detail.clients?.name}</p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {detail.implementation_modules.map((mod) => (
          <div key={mod.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-slate-900">{mod.name}</h3>
              <StatusBadge status={mod.status} />
            </div>

            <ul className="space-y-1">
              {mod.implementation_tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <span>{task.name}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} />
                    {task.status !== "done" && (
                      <button
                        onClick={() => handleCompleteTask(task)}
                        disabled={completingTaskId === task.id}
                        className="text-slate-400 hover:text-emerald-600 disabled:opacity-50"
                        aria-label="Concluir tarefa"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {detail.implementation_modules.length === 0 && (
          <p className="text-sm text-slate-400">Esta implantação ainda não tem módulos.</p>
        )}
      </div>
    </div>
  );
}
