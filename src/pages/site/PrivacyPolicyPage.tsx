import { useSeo } from "@/hooks/useSeo";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export function PrivacyPolicyPage() {
  useSeo({
    title: "Política de privacidade",
    description: "Como o Orbio coleta, usa e protege os dados de quem usa o site e o produto.",
  });

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <Breadcrumbs items={[{ label: "Início", to: "/" }, { label: "Política de privacidade" }]} />
      <h1 className="font-serif text-[30px] text-midnight-ink">Política de privacidade</h1>
      <p className="mt-2 text-[12px] text-ash-helper">Última atualização: 31 de agosto de 2026</p>

      <div className="mt-8 space-y-6 text-[14px] leading-relaxed text-graphite-body">
        <section>
          <h2 className="text-[16px] font-medium text-midnight-ink">1. Quais dados coletamos</h2>
          <p className="mt-1.5">
            Coletamos: (a) dados de cadastro e login no produto (nome, e-mail, senha
            criptografada), gerenciados pelo nosso provedor de autenticação; (b) dados que você
            mesmo insere dentro do CRM (contatos, empresas, negociações, documentos); (c) nome,
            e-mail e mensagem enviados pelo formulário de contato deste site; (d) dados de
            navegação anônimos via cookies de analytics, apenas se você aceitar no banner de
            cookies.
          </p>
        </section>
        <section>
          <h2 className="text-[16px] font-medium text-midnight-ink">2. Para que usamos</h2>
          <p className="mt-1.5">
            Para autenticar seu acesso, operar as funcionalidades do CRM, responder seu contato
            comercial e entender o uso do site para melhorá-lo. Não vendemos dados a terceiros.
          </p>
        </section>
        <section>
          <h2 className="text-[16px] font-medium text-midnight-ink">3. Com quem compartilhamos</h2>
          <p className="mt-1.5">
            Usamos provedores de infraestrutura (autenticação e banco de dados, hospedagem) que
            processam dados em nosso nome, sob nossas instruções, para operar o produto.
          </p>
        </section>
        <section>
          <h2 className="text-[16px] font-medium text-midnight-ink">4. Retenção</h2>
          <p className="mt-1.5">
            Guardamos os dados de conta enquanto ela estiver ativa. Dados de formulário de
            contato ficam armazenados até que a solicitação seja atendida e por um período
            razoável depois, para fins de histórico.
          </p>
        </section>
        <section>
          <h2 className="text-[16px] font-medium text-midnight-ink">5. Seus direitos (LGPD)</h2>
          <p className="mt-1.5">
            Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento
            entrando em contato pelo formulário desta página ou pelo e-mail informado abaixo.
          </p>
        </section>
        <section>
          <h2 className="text-[16px] font-medium text-midnight-ink">6. Cookies</h2>
          <p className="mt-1.5">
            Usamos cookies essenciais para o funcionamento do site e, apenas com seu
            consentimento, cookies de analytics para entender tráfego e uso.
          </p>
        </section>
        <section>
          <h2 className="text-[16px] font-medium text-midnight-ink">7. Contato</h2>
          <p className="mt-1.5">
            Dúvidas sobre esta política ou sobre seus dados: use o formulário de contato na
            página inicial.
          </p>
        </section>
      </div>

      <p className="mt-10 rounded-input bg-fog-surface p-4 text-[12px] text-ash-helper">
        Este texto é um rascunho de referência e não substitui aconselhamento jurídico.
        Recomendamos revisão por um advogado antes de considerá-lo definitivo.
      </p>
    </div>
  );
}
