// Integração com a Evolution API — o diferencial do produto frente a
// concorrentes que só notificam por e-mail.
//
// Mantém a lógica de envio isolada aqui para poder trocar de provedor
// (Evolution API -> Twilio -> WhatsApp Cloud API oficial) sem tocar
// no resto da aplicação.

interface SendWhatsAppParams {
  to: string; // formato E.164, ex: 5511999999999
  message: string;
}

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL as string;
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY as string;
const EVOLUTION_INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE as string;

export async function sendWhatsAppMessage({ to, message }: SendWhatsAppParams) {
  // TODO: em produção, essa chamada deve sair do backend/edge function,
  // nunca do client, pra não expor a API key da Evolution no browser.
  const response = await fetch(
    `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ number: to, text: message }),
    }
  );

  if (!response.ok) {
    throw new Error(`Falha ao enviar WhatsApp: ${response.status}`);
  }

  return response.json();
}

// Templates de mensagem reutilizáveis — mantém o texto consistente
// e fácil de ajustar num só lugar.
export const whatsappTemplates = {
  etapaConcluida: (clienteNome: string, etapa: string, linkStatus: string) =>
    `Olá, ${clienteNome}! A etapa "${etapa}" da sua implantação foi concluída. ` +
    `Acompanhe o andamento completo aqui: ${linkStatus}`,

  implantacaoIniciada: (clienteNome: string, linkStatus: string) =>
    `Olá, ${clienteNome}! Sua implantação começou. ` +
    `Você pode acompanhar cada etapa em tempo real por aqui: ${linkStatus}`,
};
