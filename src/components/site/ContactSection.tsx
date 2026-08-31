import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, MessageCircle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { submitContactLead } from "@/services/leads";

const bullets = [
  { icon: MessageCircle, text: "Conversa direta com quem constrói o produto, sem SDR de roteiro." },
  { icon: CalendarClock, text: "Respondemos em até 1 dia útil." },
  { icon: ShieldCheck, text: "Seus dados ficam só entre você e o Orbio — sem revenda pra terceiros." },
];

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
    <section id="contato" className="mx-auto max-w-5xl px-5 py-20">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <span className="mono inline-block rounded-pill bg-lavender-wash px-3 py-1 text-[11px] text-royal-signal">
            Falar com vendas
          </span>
          <h2 className="mt-4 font-serif text-[30px] leading-[1.15] text-midnight-ink">
            Conta um pouco sobre seu time e a gente entra em contato
          </h2>
          <div className="mt-6 space-y-4">
            {bullets.map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pipeline bg-fog-surface text-royal-signal">
                  <item.icon className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-[13px] text-graphite-body">{item.text}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <Card className="p-8">
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Nome">
                <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </Field>
              <Field label="E-mail de trabalho">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>
              <Field label="Como podemos ajudar">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Conte o tamanho do time e o que você busca no CRM"
                />
              </Field>
              {error ? <p className="text-[12px] text-coral-lost">{error}</p> : null}
              <Button type="submit" variant="accent" disabled={sending} className="w-full">
                {sending ? "Enviando…" : "Enviar mensagem"}
              </Button>
              <p className="text-center text-[11px] text-ash-helper">Respondemos em até 1 dia útil.</p>
            </form>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
