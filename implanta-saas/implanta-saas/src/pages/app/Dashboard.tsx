import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, CheckCircle2, AlertTriangle, type LucideIcon } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { getDashboardKpis, type OverdueTask } from "@/services/dashboard.service";
import { cn } from "@/lib/utils";

const KPI_ACCENTS = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-red-600",
} as const;

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent: keyof typeof KPI_ACCENTS;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            KPI_ACCENTS[accent]
          )}
        >
          <Icon size={22} />
        </span>
        <div>
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function OverdueRow({ task }: { task: OverdueTask }) {
  return (
    <Link
      to={`/app/implantacoes/${task.implementationId}`}
      className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-slate-50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <AlertTriangle size={16} className="shrink-0 text-red-500" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{task.name}</p>
          <p className="truncate text-xs text-slate-500">{task.implementationName}</p>
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        {task.daysLate} {task.daysLate === 1 ? "dia atrasada" : "dias atrasada"}
      </span>
    </Link>
  );
}

export default function Dashboard() {
  const { organizationId } = useOrganization();
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedThisMonthCount, setCompletedThisMonthCount] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    getDashboardKpis(organizationId)
      .then((data) => {
        setInProgressCount(data.inProgressCount);
        setCompletedThisMonthCount(data.completedThisMonthCount);
        setOverdueTasks(data.overdueTasks);
      })
      .finally(() => setLoading(false));
  }, [organizationId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Painel</h1>
        <p className="text-sm text-slate-500">Visão geral do andamento das suas implantações.</p>
      </div>

      {loading && <p className="text-slate-500">Carregando...</p>}

      {!loading && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard icon={Clock} label="Implantações em andamento" value={inProgressCount} accent="blue" />
            <KpiCard
              icon={CheckCircle2}
              label="Concluídas neste mês"
              value={completedThisMonthCount}
              accent="emerald"
            />
            <KpiCard icon={AlertTriangle} label="Tarefas atrasadas" value={overdueTasks.length} accent="red" />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-medium text-slate-900">Tarefas atrasadas</h2>
            </div>

            {overdueTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                <CheckCircle2 size={28} className="text-emerald-500" />
                <p className="text-sm font-medium text-slate-700">Nenhuma tarefa atrasada</p>
                <p className="text-sm text-slate-400">Tudo dentro do prazo. Bom trabalho.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {overdueTasks.map((task) => (
                  <OverdueRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
