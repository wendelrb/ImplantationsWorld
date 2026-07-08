import { cn } from "@/lib/utils";
import type { ImplementationStatus, TaskStatus } from "@/types/domain";

const LABELS: Record<string, string> = {
  not_started: "Não iniciado",
  in_progress: "Em andamento",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
  pending: "Pendente",
  done: "Concluído",
};

const STYLES: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  pending: "bg-slate-100 text-slate-600",
  done: "bg-emerald-100 text-emerald-700",
};

export function StatusBadge({ status }: { status: ImplementationStatus | TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status]
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
