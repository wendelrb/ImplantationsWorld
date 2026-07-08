import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Implementation } from "@/types/domain";

interface Props {
  implementation: Implementation & { clients?: { name: string } };
}

export function ImplementationCard({ implementation }: Props) {
  return (
    <Link
      to={`/app/implantacoes/${implementation.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-500 hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-slate-900">{implementation.name}</h3>
          <p className="text-sm text-slate-500">{implementation.clients?.name}</p>
        </div>
        <StatusBadge status={implementation.status} />
      </div>
    </Link>
  );
}
