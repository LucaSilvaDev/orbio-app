import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

const faqs: { question: string; answer: React.ReactNode }[] = [
  {
    question: "O que é o Orbio?",
    answer:
      "É um sistema de gestão que reúne vendas, contatos e empresas, tarefas, agenda, documentos, faturas, chat interno e relatórios num só lugar, com uma interface pensada para ser rápida e agradável no dia a dia.",
  },
  {
    question: "Para qual tipo de empresa serve?",
    answer:
      "Para pequenas e médias empresas de qualquer segmento que hoje espalham o trabalho entre planilhas, conversas soltas e ferramentas separadas, e querem centralizar tudo.",
  },
  {
    question: "Posso testar antes de contratar?",
    answer:
      "Pode explorar a demonstração agora, sem cadastro, com dados fictícios. Para usar com a sua equipe, conversamos e liberamos o acesso: o cadastro é feito por convite do dono da conta.",
  },
  {
    question: "E se um funcionário sair da empresa?",
    answer:
      "O administrador encerra o acesso e escolhe quem recebe a carteira dele (empresas, contatos, oportunidades e documentos). As conversas e os registros continuam na empresa, e tudo fica no histórico de alterações.",
  },
  {
    question: "Os dados da minha empresa estão seguros?",
    answer: (
      <>
        Cada empresa só enxerga os próprios dados (o isolamento é aplicado no banco), os arquivos ficam em armazenamento
        privado e o cofre de senhas é criptografado no seu navegador. Os detalhes do que coletamos e por quê estão na{" "}
        <Link to="/privacidade" className="underline underline-offset-2">
          política de privacidade
        </Link>
        .
      </>
    ),
  },
  {
    question: "Quanto custa?",
    answer:
      "Os planos públicos ainda estão sendo definidos. As empresas do programa piloto entram com condição especial e preço fixo por 12 meses — fale com a gente para saber como participar.",
  },
  {
    question: "Já tem cobrança por Pix/boleto e integração com banco?",
    answer:
      "Ainda não. Hoje o Orbio registra faturas com anexo, status e vencimento. Cobrança, fluxo de caixa e integração bancária estão em desenvolvimento e serão priorizados com as empresas piloto.",
  },
  {
    question: "Como funciona o suporte?",
    answer:
      "Direto com quem constrói o produto, pelo formulário abaixo. Respondemos em até 1 dia útil.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass overflow-hidden rounded-[24px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
      >
        <span className="text-[16px] font-medium tracking-[-0.01em] text-midnight-ink sm:text-[17px]">{question}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} className="shrink-0 text-ash-helper">
          <Plus className="h-5 w-5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl px-6 pb-6 text-[14px] leading-[1.65] text-slate-caption">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="mx-auto max-w-[820px] px-4 py-16 sm:py-24">
      <Reveal repeat className="text-center">
        <p className="app-eyebrow">Perguntas frequentes</p>
        <h2 className="app-display mt-3 text-[clamp(32px,4.4vw,52px)] text-midnight-ink">
          O que costumam perguntar <span className="text-ash-helper">antes de entrar.</span>
        </h2>
      </Reveal>
      <Reveal repeat delay={0.08} className="mt-10 space-y-3">
        {faqs.map((item) => (
          <FAQItem key={item.question} question={item.question} answer={item.answer} />
        ))}
      </Reveal>
    </section>
  );
}
