# Orbio — Auditoria de produto e plano para lançamento

Data: 01/10/2026 · Escopo: código (`src/`, `supabase/`), build/testes, estado do Supabase e landing pública.
Método: leitura do código e das migrations, `tsc`, `vitest`, `vite build`, inspeção no navegador e consulta somente-leitura ao Supabase.

---

## 1. Resumo executivo

O Orbio já tem **cara de produto premium** (vidro, aurora, logo animada, painel de relatórios editável, modo escuro, paleta de comandos) e uma **base multiempresa bem pensada** (workspaces, convites, RLS, storage privado, cofre criptografado no cliente).

Mas **ainda não está pronto para vender**: o back-end de produção está pausado, uma parte grande dos dados ainda mora só no navegador, o chat não é em tempo real, não existe módulo financeiro de verdade (cobrança/banco), não há planos/cobrança do próprio Orbio, e os testes cobrem quase nada.

Recomendação: **não vender como "pronto" agora. Fechar a Fase 0 (abaixo) e vender primeiro como piloto pago para 3–5 empresas.**

---

## 2. Pontos positivos (manter)

| Área | O que está bom |
|---|---|
| Identidade visual | Aurora + vidro fosco + tipografia leve; logo orbital animada; modo claro/escuro; seletor de cor de destaque |
| Experiência | Command palette (⌘K), sidebar recolhível, transições, CountUp, relatórios arrastáveis com 8 tipos de gráfico |
| Multiempresa | `workspaces` + `memberships` + `invites`; todas as tabelas com RLS por workspace; `ensure_my_workspace` / `accept_invite` como `security definer` com `search_path` fixo |
| Arquivos | Bucket privado, URLs assinadas, hash SHA-256 por arquivo, políticas de storage por pasta (docs/invoices/chat/vault) |
| Segurança de dados sensíveis | Cofre com PBKDF2 (310k) + AES-GCM, chave não exportável em IndexedDB; só o texto cifrado vai à nuvem |
| Separação demo/produção | Workspace QA com dados fictícios isolado do oficial; `.env` fora do git; só chave pública (anon) no front |
| Site público | SEO básico, 404, FAQ, política de privacidade, banner de cookies (LGPD), formulário de contato gravando em `contact_leads` |
| Saúde técnica | `tsc` limpo, build ok, TypeScript estrito, estrutura de pastas coerente |

---

## 3. Pontos negativos e riscos

Prioridade: **P0** = bloqueia a venda · **P1** = necessário nos primeiros clientes · **P2** = diferencial.

### P0 — Bloqueadores

1. **Back-end pausado.** O projeto Supabase `orbio` (sa-east-1) está `INACTIVE`. Sem ele, login, núcleo comercial, arquivos e chat do ambiente oficial não funcionam. Plano gratuito pausa por inatividade; para vender é preciso plano pago.
   Não foi possível confirmar se as duas migrations (`core_crm`, `durable_store`) foram aplicadas nem rodar os alertas de segurança enquanto estiver pausado.
2. **Dados que ainda vivem só no navegador** (`localStorage`): leads, tarefas/atividades, notas, agenda e lembretes, produtos, campanhas, notificações, mapas/fluxos e o layout dos relatórios. Trocar de computador, limpar o cache ou outra pessoa do time abrir o sistema = **não vê / perde**. Isso contradiz a promessa "a empresa concentra tudo e não perde histórico".
   Já estão na nuvem: empresas, contatos, deals, documentos, faturas, chat e cofre.
3. **Chat interno não é em tempo real.** A sincronização acontece só ao entrar (`useCoreSync`); não há Realtime nem polling. Uma mensagem enviada por um colega só aparece depois de recarregar. Sem isso, "dispensar o WhatsApp" não se sustenta.
4. **Sem módulo financeiro real.** "Faturas" é cadastro + anexo de PDF + status manual. Não há cobrança (Pix/boleto), contas a pagar/receber, fluxo de caixa, conciliação, nem leitura de banco. "Onde estão indo os pagamentos" hoje não é respondido.
5. **Sem cobrança do próprio Orbio.** Não existem planos, trial, limites, checkout, nota fiscal, nem tela de criar/gerenciar a empresa. A landing não tem preço.
6. **Permissões fracas.** Só existem `owner` e `member`. Pela RLS, qualquer membro pode editar e apagar qualquer empresa, contato, deal ou fatura. Não há papéis (admin, financeiro, vendedor, leitura), nem log de auditoria, nem exclusão lógica. Isso é o oposto do requisito "a empresa não perde histórico quando o funcionário sai".
7. **Sem rotina de desligamento de funcionário.** Não há "transferir carteira / conversas / arquivos para outra pessoa" nem desativar acesso preservando o histórico.

### P1 — Primeiros clientes

8. **Qualidade/observabilidade:** só 5 testes (utilitário de caminhos). Nenhum teste de fluxo, nem de RLS. Sem lint, sem CI, sem monitoramento de erros (ex.: Sentry), sem backup/exportação completa.
9. **Desempenho:** `index` 737 KB, `ExportMenu` 418 KB (jsPDF/html2canvas carregados no app), `Viz` 385 KB (Recharts). Dá para dividir e carregar sob demanda.
10. **E-mails transacionais** (confirmação, convite, recuperação) com remetente padrão do Supabase, sem domínio/SMTP próprio. Passa imagem amadora e cai em spam.
11. **Segurança de conta:** sem 2FA, sem sessões ativas/forçar logout, sem política de senha própria.
12. **LGPD/jurídico:** política de privacidade é rascunho; faltam Termos de Uso, contrato/DPA para clientes, política de retenção e exclusão de dados.
13. **Mobile:** o app foi desenhado e verificado em desktop; falta passada completa em celular/tablet (kanban, tabelas, relatórios).
14. **Imprecisões de dados na UI (corrigir antes de demonstrar):**
    - Dashboard: o cartão "Ganho no mês" soma **todos** os deals ganhos, não os do mês.
    - Dashboard: a "Agenda do time" mostra sempre o avatar do usuário `u1`, em vez do responsável real.
    - Relatórios: "Mês" usa a data de atualização do deal, não a de fechamento.

### P1/P2 — Landing page

15. Sem seção de **preços**, sem **prova social real** (placeholder), capturas de tela da **interface antiga**, nenhuma demonstração do produto animado.
16. Linguagem visual **diferente do app** (hero serifado/editorial vs. app com aurora/vidro/sans). A primeira impressão não combina com o produto.
17. Faltam seções-padrão de SaaS: recursos, segurança, integrações, comparativo, "como funciona", chamada para teste grátis, rodapé completo. GA sem ID configurado; `og-image.png` precisa ser conferida.

---

## 4. O que falta construir (visão "concentrar a empresa")

### 4.1 Núcleo (completar)
- Migrar para a nuvem: leads, tarefas, notas, agenda, produtos, campanhas, notificações, relatórios (layout por usuário/empresa).
- Chat em tempo real (Supabase Realtime): presença, não lidas, menções, busca, anexos, canais por equipe, histórico imutável da empresa.
- Papéis e permissões (owner, admin, financeiro, vendedor, leitura) aplicados na RLS, não só na tela.
- Auditoria: quem criou/alterou/apagou o quê, com exclusão lógica e restauração.
- Offboarding: desativar usuário, transferir carteira/tarefas/arquivos/conversas.
- Importação CSV (leads/contatos/empresas) e exportação completa.

### 4.2 Financeiro (principal diferencial)
- Contas a receber e a pagar, vencimentos, recorrência.
- Cobrança Pix/boleto com baixa automática (provedores brasileiros como Asaas, Mercado Pago ou Stripe).
- Fluxo de caixa e DRE simples, centros de custo, categorias.
- **Open Finance** (extrato somente leitura via Pluggy/Belvo) para conciliação e para responder "para onde estão indo os pagamentos".
- Emissão de NFS-e/NF-e via serviço especializado (Focus NFe, eNotas).

### 4.3 Documentos
- Versionamento, pastas, vínculo com deal/empresa/fatura, assinatura eletrônica (ZapSign/ClickSign), vencimento de contratos com alerta.

### 4.4 Comunicação
- Chat interno (acima) + **registro das conversas com clientes**: e-mail (Gmail/Outlook) e WhatsApp Business API gravando dentro do CRM. Observação: o chat interno resolve a comunicação do time, mas **clientes continuam no WhatsApp**; a diferença é que a conversa passa a ser da empresa, não do celular do funcionário.

### 4.5 Plataforma
- Planos, trial, checkout e limites (por usuário/armazenamento).
- Webhooks e API pública; integrações (Google Calendar, Zapier/Make).
- IA aplicada: resumo de conversas, previsão de fechamento, próxima ação sugerida.
- Central de notificações (e-mail + push) e preferências.

---

## 5. Plano de execução

### Fase 0 — Preparar para vender (bloqueadores)
1. Fazer upgrade e reativar o Supabase `orbio`; aplicar as migrations; rodar alertas de segurança e performance.
2. Mover os módulos restantes para a nuvem (item 4.1) com RLS.
3. Chat em tempo real.
4. Papéis/permissões + auditoria + exclusão lógica + offboarding.
5. Planos, trial e cobrança do Orbio (checkout), tela da empresa e onboarding guiado.
6. SMTP/domínio próprio, Sentry, backup, CI com build + testes.
7. Testes dos fluxos críticos (cadastro → convite → CRUD → arquivos → chat) e de RLS (um usuário nunca vê outra empresa).
8. Corrigir as imprecisões do item 14.
9. **Nova landing page** (seção 6) + Termos de Uso + política revisada por advogado.

### Fase 1 — Financeiro v1
Contas a receber/pagar, Pix/boleto, fluxo de caixa, documentos com versões e assinatura.

### Fase 2 — Diferenciais
Open Finance, NFS-e, WhatsApp/e-mail no CRM, API pública, IA.

---

## 6. Nova landing page (proposta)

Objetivo: parecer o produto. Mesma linguagem do app (aurora, vidro, sans leve) com movimento tecnológico.

Estrutura:
1. **Hero** — título curto + produto vivo ao lado (painel com gráficos animando, cards flutuando com parallax) + CTA "Testar grátis" / "Ver demonstração".
2. **Barra de confiança** — segurança, LGPD, dados no Brasil.
3. **Tudo num lugar** — cards animados de Pipeline, Financeiro, Documentos, Chat, Relatórios, Cofre.
4. **Demonstração interativa** — rolagem controlando um painel real (kanban se movendo, gráfico preenchendo).
5. **Financeiro e banco** — fluxo de caixa animado, integração bancária (quando disponível, marcada como "em breve" se ainda não existir).
6. **Segurança e histórico da empresa** — "ninguém sai levando a conversa"; auditoria; cofre criptografado.
7. **Como funciona** — 3 passos.
8. **Preços** — planos e FAQ.
9. **CTA final + rodapé completo.**

Técnica: Framer Motion (scroll-linked), SVG animado, gradientes em malha, respeitando `prefers-reduced-motion`; imagens do produto regeradas com a interface nova.

Dependência: os **preços e a lista real de funcionalidades** precisam estar definidos. Não devemos anunciar o que ainda não funciona.

---

## 7. Decisões que dependem de você
1. Quem é o primeiro cliente-alvo (segmento/porte)? Define prioridades de campos e fluxos.
2. Modelo de preço (por usuário, por empresa, faixas)?
3. Provedor de cobrança preferido (Asaas, Mercado Pago, Stripe)?
4. Fazer o upgrade do Supabase agora (custo mensal)?

---

## 8. Progresso da Fase 0 (atualizado em 01/10/2026)

| Item | Estado |
|---|---|
| Migration base (`profiles`, `contact_leads`) versionada | Feito — `20260901000000_baseline_profiles_leads.sql` (conferir com produção ao reativar) |
| Papéis: dono, administrador, financeiro, vendedor, leitura | Feito no banco (RLS) e na tela Equipe |
| Módulos na nuvem (leads, tarefas, notas, agenda, produtos, campanhas, mapas, layout dos relatórios) | Feito — tabela `workspace_items`; importa automaticamente o que o usuário tinha só no navegador |
| Chat e dados em tempo real | Feito (Supabase Realtime) + ressincronização ao voltar para a aba |
| Histórico de alterações e lixeira (restaurar exclusões) | Feito — painel em Equipe, para dono/administrador |
| Desligar funcionário e transferir carteira | Feito — acesso encerrado, histórico e nome preservados |
| Gravações que falhavam em silêncio | Corrigido — agora avisa o usuário |
| Erros de dados do Dashboard | Corrigidos |
| Testes de banco/RLS (32 verificações em Postgres real) | Feito — roda no `npm test` |
| **Aplicar as migrations no Supabase / VPS** | **Pendente — depende de reativar/escolher o servidor** |
| Teste ponta a ponta contra o banco real | Pendente (mesma dependência) |
| Planos e cobrança (Asaas), SMTP próprio, Sentry, CI | Pendente |
| Landing page nova | Pendente |

Limitações conhecidas desta entrega:
- A restrição de papéis é garantida pelo banco. Na tela, só o modo "somente leitura" mostra aviso; botões de edição ainda aparecem para o leitor (a ação é bloqueada e o usuário é avisado).
- A lixeira restaura empresas, contatos, oportunidades, faturas e itens dos módulos; documentos (arquivos) e membros não são restauráveis por ela.
