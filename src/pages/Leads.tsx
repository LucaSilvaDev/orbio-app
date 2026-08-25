import { useState } from "react";
import { PageHeader, SearchField } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { useUi } from "@/store/useUi";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { findUser } from "@/lib/records";
import type { LeadStatus } from "@/types";

const tone: Record<LeadStatus, "blue" | "amber" | "mint" | "coral"> = {
  new: "blue",
  working: "amber",
  qualified: "mint",
  unqualified: "coral",
};

const label: Record<LeadStatus, string> = {
  new: "Novo",
  working: "Em trabalho",
  qualified: "Qualificado",
  unqualified: "Desqualificado",
};

export function LeadsPage() {
  const { leads, addLead, convertLead, removeLead, updateLead } = useCrm();
  const user = useAuth((s) => s.user);
  const pushToast = useUi((s) => s.pushToast);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const rows = leads.filter((l) =>
    `${l.name} ${l.company} ${l.email} ${l.phone ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        kicker="Comercial"
        title="Leads"
        description="A porta de entrada. Qualifique, descarte ou converta em deal."
        actions={
          <>
            <SearchField value={query} onChange={setQuery} placeholder="Buscar lead" />
            <ExportMenu
              title="leads-orbio"
              headers={["Nome", "Empresa", "E-mail", "Telefone", "Origem", "Score", "Status"]}
              rows={rows.map((l) => [l.name, l.company, l.email, l.phone ?? "", l.source, l.score, label[l.status]])}
            />
            <Button variant="dark" onClick={() => setOpen(true)}>
              Novo lead
            </Button>
          </>
        }
      />
      <Card padded={false} className="overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-fog-surface text-ash-helper">
            <tr>
              {["Nome", "Empresa", "Contato", "Origem", "Score", "Status", "Dono", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => (
              <tr key={lead.id} className="border-t border-stone-divider">
                <td className="px-4 py-3 font-medium">{lead.name}</td>
                <td className="px-4 py-3">{lead.company}</td>
                <td className="px-4 py-3 text-slate-caption">
                  <p>{lead.email}</p>
                  {lead.phone ? (
                    <a href={`tel:${lead.phone.replace(/\D/g, "")}`} className="text-royal-signal">
                      {lead.phone}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-caption">{lead.source}</td>
                <td className="px-4 py-3">{lead.score}</td>
                <td className="px-4 py-3">
                  <Badge tone={tone[lead.status]}>{label[lead.status]}</Badge>
                </td>
                <td className="px-4 py-3">{findUser(lead.ownerId)?.name.split(" ")[0]}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      convertLead(lead.id);
                      pushToast("Lead convertido em deal");
                    }}
                  >
                    Converter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      updateLead(lead.id, {
                        status: lead.status === "working" ? "qualified" : "working",
                      });
                    }}
                  >
                    Avançar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeLead(lead.id)}>
                    Apagar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={open} title="Novo lead" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            addLead({
              name,
              company,
              email,
              phone,
              source: "Manual",
              status: "new",
              score: 60,
              ownerId: user?.id ?? "u1",
            });
            pushToast("Lead criado");
            setOpen(false);
            setName("");
            setCompany("");
            setEmail("");
            setPhone("");
          }}
        >
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Empresa">
            <Input value={company} onChange={(e) => setCompany(e.target.value)} required />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Telefone">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-0000"
              required
            />
          </Field>
          <Button type="submit" variant="dark" className="w-full">
            Salvar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
