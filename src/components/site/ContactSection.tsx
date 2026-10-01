import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Reveal } from "@/components/motion/Reveal";
import { submitContactLead } from "@/services/leads";

const bullets = [
  "Conversa direta com quem constrói o produto, sem roteiro de vendas.",
  "Respondemos em até 1 dia útil.",
  "Seus dados ficam só entre você e o Orbio — sem revenda para terceiros.",
];

const fieldClass =
  "!h-12 !bg-white/70 ring-1 ring-white focus:!bg-white focus:shadow-focus outline-none";

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
    <section id="contato" className="mx-auto max-w-[1180px] px-4 py-16 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Reveal>
          <p className="app-eyebrow">Falar com a gente</p>
          <h2 className="app-display mt-3 text-[clamp(34px,4.8vw,58px)] text-midnight-ink">
            Conte sobre a sua empresa. <span className="text-ash-helper">A gente responde.</span>
          </h2>
          <ul className="mt-8 space-y-3">
            {bullets.map((text) => (
              <li key={text} className="flex gap-3 text-[15px] leading-[1.5] text-slate-caption">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-royal-signal" />
                {text}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <form onSubmit={onSubmit} className="glass space-y-5 rounded-[32px] p-6 sm:p-8">
            <Field label="Nome">
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className={fieldClass} />
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
                placeholder="Tamanho do time, segmento e o que você busca no sistema"
                className="!bg-white/70 ring-1 ring-white outline-none focus:!bg-white focus:shadow-focus"
              />
            </Field>
            {error ? <p className="text-[13px] text-coral-lost">{error}</p> : null}
            <button
              type="submit"
              disabled={sending}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-midnight-ink px-6 text-[14px] font-medium text-snow-canvas shadow-[0_18px_36px_-18px_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {sending ? "Enviando…" : "Enviar mensagem"}
            </button>
            <p className="text-center text-[12px] text-ash-helper">Respondemos em até 1 dia útil.</p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
