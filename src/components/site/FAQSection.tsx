import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/motion/Reveal";

const faqs = [
  {
    question: "O que é o Orbio?",
    answer:
      "É um CRM que reúne pipeline de vendas, contatos, empresas, faturas e campanhas num único workspace, com uma interface pensada pra ser rápida no dia a dia do time comercial.",
  },
  {
    question: "Pra que tipo de empresa o Orbio serve?",
    answer:
      "Serve times comerciais de qualquer segmento que hoje organizam vendas em planilha ou em ferramentas separadas e querem centralizar isso num só lugar.",
  },
  {
    question: "Como funciona o período de teste?",
    answer:
      "Você cria uma conta e explora o produto direto — sem precisar falar com vendas antes. Se preferir uma demonstração guiada, é só usar o formulário de contato abaixo.",
  },
  {
    question: "Como o Orbio trata os dados da minha empresa?",
    answer:
      "O login e os dados de conta ficam no Supabase, com autenticação e políticas de acesso próprias. Detalhes completos — o que coletamos, por quê e por quanto tempo — estão na nossa política de privacidade.",
  },
  {
    question: "Como funciona o suporte?",
    answer:
      "Hoje o suporte é feito por contato direto pelo formulário — respondemos em até 1 dia útil. Estamos ainda estruturando canais adicionais conforme a base de clientes cresce.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone-divider py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[14px] font-medium text-midnight-ink">{question}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-ash-helper transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="mt-2 text-[13px] text-graphite-body">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
      <Reveal>
        <h2 className="text-center font-serif text-[30px] text-midnight-ink">
          Perguntas frequentes
        </h2>
      </Reveal>
      <Reveal delay={0.1} className="mt-8">
        {faqs.map((item) => (
          <FAQItem key={item.question} question={item.question} answer={item.answer} />
        ))}
      </Reveal>
    </section>
  );
}
