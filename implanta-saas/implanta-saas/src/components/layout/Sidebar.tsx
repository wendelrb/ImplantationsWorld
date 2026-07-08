import { NavLink } from "react-router-dom";
import { LayoutDashboard, Workflow, Users, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/app", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/app/implantacoes", label: "Implantações", icon: Workflow },
  { to: "/app/clientes", label: "Clientes", icon: Users },
  { to: "/app/templates", label: "Templates", icon: ClipboardList },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white p-4">
      <div className="mb-6 px-2 text-lg font-semibold text-slate-900">Implanta</div>
      <nav className="space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100",
                isActive && "bg-brand-50 text-brand-700"
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
