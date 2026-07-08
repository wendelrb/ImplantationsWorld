import { useParams } from "react-router-dom";

export default function ImplementationDetail() {
  const { id } = useParams();
  // TODO: buscar implantação por id, listar módulos/tarefas,
  // permitir marcar tarefa como concluída (o que dispara notifyImplementationUpdate).
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Implantação {id}</h1>
      <p className="text-slate-500">Timeline de módulos e tarefas entra aqui.</p>
    </div>
  );
}
