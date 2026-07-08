import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { ImplementationCard } from "@/components/implementations/ImplementationCard";
import {
  listImplementations,
  createImplementationFromTemplate,
} from "@/services/implementations.service";
import { listClients } from "@/services/clients.service";
import { listTemplates } from "@/services/templates.service";
import { useOrganization } from "@/hooks/useOrganization";
import type { Client } from "@/types/domain";

export default function Implementations() {
  const { organizationId } = useOrganization();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [clientId, setClientId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function refresh() {
    if (!organizationId) return;
    const data = await listImplementations(organizationId);
    setItems(data ?? []);
  }

  useEffect(() => {
    if (!organizationId) return;
    refresh().finally(() => setLoading(false));
  }, [organizationId]);

  async function openForm() {
    if (!organizationId) return;
    setFormError(null);
    setShowForm(true);
    const [clientsData, templatesData] = await Promise.all([
      listClients(organizationId),
      listTemplates(organizationId),
    ]);
    setClients(clientsData);
    setTemplates(templatesData);
  }

  async function handleSubmit() {
    if (!organizationId || !clientId || !templateId || !name.trim()) {
      setFormError("Preencha cliente, template e nome da implantação.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await createImplementationFromTemplate({
        organizationId,
        clientId,
        templateId,
        name: name.trim(),
      });
      setShowForm(false);
      setName("");
      setClientId("");
      setTemplateId("");
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao criar implantação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Implantações</h1>
        <button
          onClick={openForm}
          className="flex items-center gap-1 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-900"
        >
          <Plus size={16} /> Nova implantação
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Nova implantação</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Cliente</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Selecione</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Selecione</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Nome da implantação
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Implantação - Cliente X"
                className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              />
            </div>
          </div>

          {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
          {clients.length === 0 && (
            <p className="mt-2 text-sm text-amber-600">
              Nenhum cliente cadastrado ainda — cadastre um cliente antes de criar uma implantação.
            </p>
          )}
          {templates.length === 0 && (
            <p className="mt-2 text-sm text-amber-600">
              Nenhum template cadastrado ainda — crie um em "Templates" antes de continuar.
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-50"
          >
            {submitting ? "Criando..." : "Criar implantação"}
          </button>
        </div>
      )}

      {loading && <p className="text-slate-500">Carregando...</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ImplementationCard key={item.id} implementation={item} />
        ))}
      </div>
    </div>
  );
}
