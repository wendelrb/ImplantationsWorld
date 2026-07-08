import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { getImplementationByPublicToken } from "@/services/implementations.service";
import { cn } from "@/lib/utils";

// Esta é a página que o cliente final acessa sem login — o diferencial
// central do produto frente às ferramentas enterprise (GuideCx, Rocketlane)
// que não têm um equivalente tão simples, e frente ao ImplantaWeb, que
// tem portal do cliente mas sem notificação nativa por WhatsApp.
//
// Rota sugerida: /status/:token

export default function PublicStatus() {
  const { token } = useParams();
  const [implementation, setImplementation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getImplementationByPublicToken(token)
      .then(setImplementation)
      .catch(() => setError("Link inválido ou expirado."));
  }, [token]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  if (!implementation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Carregando...</p>
      </div>
    );
  }

  const modules = implementation.modules ?? [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-slate-500">Acompanhamento de implantação</p>
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">
          {implementation.name}
        </h1>
        <p className="mb-8 text-slate-500">{implementation.client_name}</p>

        <div className="space-y-6">
          {modules.map((mod: any) => (
            <div key={mod.id}>
              <h2 className="mb-3 font-medium text-slate-900">{mod.name}</h2>
              <ul className="space-y-2">
                {(mod.tasks ?? []).map((task: any) => (
                  <li key={task.id} className="flex items-center gap-2 text-sm">
                    {task.status === "done" ? (
                      <CheckCircle2 size={18} className="text-emerald-600" />
                    ) : task.status === "in_progress" ? (
                      <Clock size={18} className="text-blue-600" />
                    ) : (
                      <Circle size={18} className="text-slate-300" />
                    )}
                    <span
                      className={cn(
                        "text-slate-700",
                        task.status === "done" && "text-slate-400 line-through"
                      )}
                    >
                      {task.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
