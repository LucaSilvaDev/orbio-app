import { supabase } from "@/services/supabase";

type ContactLeadInput = {
  name: string;
  email: string;
  message: string;
};

export async function submitContactLead(input: ContactLeadInput): Promise<{ error: string | null }> {
  const payload = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    message: input.message.trim(),
  };

  const cloud = supabase
    ? supabase.from("contact_leads").insert(payload).then(({ error }) => !error)
    : Promise.resolve(false);

  const inbox = fetch("https://formsubmit.co/ajax/contato@orbio.app.br", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      ...payload,
      _subject: "Lead Orbio — formulário do site",
      _template: "table",
    }),
  })
    .then((res) => res.ok)
    .catch(() => false);

  const [saved, mailed] = await Promise.all([cloud, inbox]);
  if (!saved && !mailed) {
    return { error: "Não deu pra enviar agora. Tenta de novo em instantes." };
  }
  return { error: null };
}
