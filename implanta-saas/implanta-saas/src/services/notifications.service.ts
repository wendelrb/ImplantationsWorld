import { supabase } from "@/config/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// Registra a notificação no banco (auditável) e dispara via WhatsApp.
// Mantém as duas coisas juntas aqui pra nunca ter envio sem rastro.
export async function notifyImplementationUpdate(params: {
  organizationId: string;
  implementationId: string;
  phone: string;
  message: string;
}) {
  const { organizationId, implementationId, phone, message } = params;

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      organization_id: organizationId,
      implementation_id: implementationId,
      channel: "whatsapp",
      recipient: phone,
      message,
      status: "queued",
    })
    .select()
    .single();

  if (error) throw error;

  try {
    await sendWhatsAppMessage({ to: phone, message });
    await supabase
      .from("notifications")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", data.id);
  } catch (err) {
    await supabase.from("notifications").update({ status: "failed" }).eq("id", data.id);
    throw err;
  }
}
