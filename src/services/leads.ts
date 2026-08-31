import { supabase } from "@/services/supabase";

type ContactLeadInput = {
  name: string;
  email: string;
  message: string;
};

export async function submitContactLead(input: ContactLeadInput): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Formulário indisponível no momento. Escreva pra contato@orbio.app.br." };
  }

  const { error } = await supabase.from("contact_leads").insert({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    message: input.message.trim(),
  });

  if (error) {
    return { error: "Não deu pra enviar agora. Tenta de novo em instantes." };
  }
  return { error: null };
}
