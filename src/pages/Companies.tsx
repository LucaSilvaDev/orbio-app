import { Link, useParams } from "react-router-dom";
import { PageHeader, SearchField } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { Reveal } from "@/components/motion/Reveal";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { useUi } from "@/store/useUi";
import { brl } from "@/lib/cn";
import { findUser, healthTone } from "@/lib/records";
import { formatCnpj } from "@/lib/cnpj";
import { useState } from "react";

export function CompaniesPage() {
  const companies = useCrm((s) => s.companies) ?? [];
  const contacts = useCrm((s) => s.contacts) ?? [];
  const deals = useCrm((s) => s.deals) ?? [];
  const addCompany = useCrm((s) => s.addCompany);
  const removeCompany = useCrm((s) => s.removeCompany);
  const user = useAuth((s) => s.user);
  const pushToast = useUi((s) => s.pushToast);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("Tecnologia");
  const [city, setCity] = useState("São Paulo");
  const [cnpj, setCnpj] = useState("");
  const rows = companies.filter((c) =>
    `${c.name} ${c.domain} ${c.cnpj ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        kicker="Comercial"
        title="Empresas"
        description="Contas com saúde, ARR e cobertura de relacionamento."
        actions={
          <>
            <SearchField value={query} onChange={setQuery} placeholder="Buscar empresa" />
            <ExportMenu
              title="empresas-orbio"
              headers={["Nome", "CNPJ", "Domínio", "Setor", "Cidade", "ARR", "Saúde"]}
              rows={rows.map((c) => [c.name, c.cnpj ?? "", c.domain, c.industry, c.city, c.arr, c.health])}
            />
            <Button variant="dark" onClick={() => setOpen(true)}>
              Nova empresa
            </Button>
          </>
        }
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((company, i) => {
          const people = contacts.filter((c) => c.companyId === company.id).length;
          const openDeals = deals.filter((d) => d.companyId === company.id && d.stage !== "lost").length;
          const owner = findUser(company.ownerId);
          return (
            <Reveal key={company.id} delay={i * 0.04}>
              <Card className="h-full">
                <Link to={`/companies/${company.id}`} className="block">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-[16px] font-semibold">{company.name}</h2>
                      <p className="text-[12px] text-ash-helper">
                        {company.cnpj ? `${company.cnpj} · ` : ""}
                        {company.domain}
                      </p>
                    </div>
                    <Badge tone={healthTone(company.health)}>{company.health}</Badge>
                  </div>
                  <p className="mt-4 font-mono text-[20px] tracking-[-0.04em] text-royal-signal">
                    {brl.format(company.arr)}
                  </p>
                  <p className="mt-3 text-[13px] text-slate-caption">
                    {company.industry} · {company.city} · {people} pessoas · {openDeals} deals
                  </p>
                  <p className="mt-2 text-[12px] text-ash-helper">Dono: {owner?.name}</p>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => {
                    removeCompany(company.id);
                    pushToast("Empresa removida");
                  }}
                >
                  Apagar
                </Button>
              </Card>
            </Reveal>
          );
        })}
      </div>
      <Modal open={open} title="Nova empresa" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            addCompany({
              name,
              domain: domain || `${name.toLowerCase().replaceAll(" ", "")}.com.br`,
              cnpj,
              industry,
              employees: "1–50",
              city,
              country: "Brasil",
              arr: 0,
              health: 70,
              ownerId: user?.id ?? "u1",
              tags: ["novo"],
              createdAt: new Date().toISOString().slice(0, 10),
            });
            pushToast("Empresa criada");
            setOpen(false);
            setName("");
            setDomain("");
            setCnpj("");
          }}
        >
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="CNPJ">
            <Input
              value={cnpj}
              onChange={(e) => setCnpj(formatCnpj(e.target.value))}
              placeholder="00.000.000/0001-00"
              inputMode="numeric"
              required
            />
          </Field>
          <Field label="Domínio">
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="empresa.com.br" />
          </Field>
          <Field label="Setor">
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </Field>
          <Field label="Cidade">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Button type="submit" variant="dark" className="w-full">
            Salvar
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export function CompanyDetailPage() {
  const { id = "" } = useParams();
  const { companies, contacts, deals, notes, addNote } = useCrm();
  const user = useAuth((s) => s.user);
  const [body, setBody] = useState("");
  const company = companies.find((c) => c.id === id);
  if (!company) return <p>Empresa não encontrada.</p>;
  const people = contacts.filter((c) => c.companyId === company.id);
  const opps = deals.filter((d) => d.companyId === company.id);

  return (
    <div>
      <PageHeader
        kicker={company.industry}
        title={company.name}
        description={`${company.cnpj ? `${company.cnpj} · ` : ""}${company.city}, ${company.country} · ${company.employees} pessoas`}
        actions={
          <ExportMenu
            title={`empresa-${company.name}`}
            headers={["Campo", "Valor"]}
            rows={[
              ["Nome", company.name],
              ["CNPJ", company.cnpj ?? ""],
              ["ARR", company.arr],
              ["Saúde", company.health],
              ["Pessoas", people.length],
            ]}
          />
        }
      />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Card>
          <p className="text-[12px] text-ash-helper">CNPJ</p>
          <p className="mt-1 font-mono text-[16px]">{company.cnpj || "—"}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-ash-helper">ARR</p>
          <p className="mt-1 font-mono text-[22px] text-royal-signal">{brl.format(company.arr)}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-ash-helper">Saúde</p>
          <p className="mt-1 text-[22px] font-semibold">{company.health}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-ash-helper">Cobertura</p>
          <p className="mt-1 text-[22px] font-semibold">{people.length} contatos</p>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Pessoas</h3>
          {people.map((person) => (
            <Link key={person.id} to={`/contacts/${person.id}`} className="flex justify-between py-2 text-[14px]">
              <span>{person.name}</span>
              <span className="text-ash-helper">{person.title}</span>
            </Link>
          ))}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Deals</h3>
          {opps.map((deal) => (
            <Link key={deal.id} to={`/pipeline/${deal.id}`} className="flex justify-between py-2 text-[14px]">
              <span>{deal.name}</span>
              <span className="text-royal-signal">{brl.format(deal.value)}</span>
            </Link>
          ))}
          <form
            className="mt-4 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!body.trim()) return;
              addNote({
                relatedType: "company",
                relatedId: company.id,
                authorId: user?.id ?? "u1",
                title: company.name,
                body,
              });
              setBody("");
            }}
          >
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Nota sobre a conta" />
            <Button type="submit" size="sm" variant="outline">
              Adicionar nota
            </Button>
          </form>
          {notes
            .filter((n) => n.relatedId === company.id)
            .map((note) => (
              <p key={note.id} className="mt-3 rounded-card bg-fog-surface p-3 text-[13px]">
                {note.body}
              </p>
            ))}
        </Card>
      </div>
    </div>
  );
}
