import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Reveal } from "@/components/motion/Reveal";
import { submitContactLead } from "@/services/leads";

const bullets = [
  "Conversa direta com quem constrói o produto, sem SDR de roteiro.",
  "Respondemos em até 1 dia útil.",
  "Seus dados ficam só entre você e o Orbio — sem revenda pra terceiros.",
];

const fieldClass =
  "h-12 rounded-[5px] bg-transparent px-0 text-[16px] ring-0 border-0 border-b border-stone-divider focus:border-midnight-ink focus:shadow-none";

export function ContactSection() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSending(true);
    const { error: submitError } = await submitContactLead({ name, email, message });
    setSending(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    navigate("/obrigado");
  }

  return (
    <section id="contato" className="site-wrap grid gap-12 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <Reveal>
        <p className="site-kicker text-ash-helper">Falar com vendas</p>
        <h2 className="mt-4 font-serif text-[clamp(36px,5vw,72px)] leading-[0.92] tracking-[-0.04em] text-midnight-ink">
          Conta sobre o time. A gente responde.
        </h2>
        <ul className="mt-8 space-y-4">
          {bullets.map((text) => (
            <li key={text} className="text-[18px] leading-[1.35] tracking-[-0.02em] text-graphite-body">
              {text}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={0.1}>
        <form onSubmit={onSubmit} className="space-y-8">
          <Field label="Nome">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className={fieldClass}
            />
          </Field>
          <Field label="E-mail de trabalho">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={fieldClass}
            />
          </Field>
          <Field label="Como podemos ajudar">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="Tamanho do time e o que você busca no CRM"
              className="min-h-32 rounded-[5px] border border-stone-divider bg-transparent px-3 py-3 text-[16px] shadow-none focus:shadow-none"
            />
          </Field>
          {error ? <p className="text-[14px] text-coral-lost">{error}</p> : null}
          <button type="submit" disabled={sending} className="site-cta">
            {sending ? "Enviando…" : "Enviar mensagem"}
          </button>
          <p className="site-kicker text-ash-helper">Respondemos em até 1 dia útil.</p>
        </form>
      </Reveal>
    </section>
  );
}
