import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { listClients, createClient, deleteClient } from "@/services/clients.service";
import type { Client } from "@/types/domain";

export default function Clients() {
  const { organizationId } = useOrganization();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function refresh() {
    if (!organizationId) return;
    const data = await listClients(organizationId);
    setClients(data);
  }

  useEffect(() => {
    if (!organizationId) return;
    refresh().finally(() => setLoading(false));
  }, [organizationId]);

  async function handleSubmit() {
    if (!organizationId || !name.trim()) {
      setFormError("Preencha o nome do cliente.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await createClient({
        organization_id: organizationId,
        name: name.trim(),
        document: document.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        custom_fields: {},
      });
      setName("");
      setDocument("");
      setEmail("");
      setPhone("");
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao criar cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteClient(id);
    await refresh();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Clientes</h1>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-medium text-slate-900">Novo cliente</h2>

        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Documento</label>
            <input
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="CNPJ / CPF"
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@cliente.com"
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Telefone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            />
          </div>
        </div>

        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-50"
        >
          {submitting ? "Criando..." : "Criar cliente"}
        </button>
      </div>

      {loading && <p className="text-slate-500">Carregando...</p>}

      {!loading && clients.length === 0 && (
        <p className="text-sm text-slate-400">Nenhum cliente cadastrado ainda. Crie o primeiro acima.</p>
      )}

      {!loading && clients.length > 0 && (
        <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {clients.map((client) => (
            <div key={client.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{client.name}</p>
                <p className="text-xs text-slate-500">
                  {[client.document, client.email, client.phone].filter(Boolean).join(" · ") || "Sem dados adicionais"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(client.id)}
                className="text-slate-400 hover:text-red-600"
                aria-label="Excluir cliente"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
