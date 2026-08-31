import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader, SearchField } from "@/components/layout/PageHeader";
import { ViewSwitcher } from "@/components/layout/ViewSwitcher";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useCrm } from "@/store/useCrm";
import { useAuth } from "@/store/useAuth";
import { useUi } from "@/store/useUi";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { findCompany, findUser } from "@/lib/records";
import { healthTone } from "@/lib/records";

export function ContactsPage() {
  const { contacts, companies, addContact, removeContact } = useCrm();
  const user = useAuth((s) => s.user);
  const pushToast = useUi((s) => s.pushToast);
  const viewMode = useUi((s) => s.viewMode);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");

  const rows = contacts.filter((c) =>
    `${c.name} ${c.email} ${c.title}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        kicker="Comercial"
        title="Contatos"
        description="Pessoas que movem a receita — com score, dono e último toque."
        actions={
          <>
            <ViewSwitcher />
            <SearchField value={query} onChange={setQuery} placeholder="Buscar contato" />
            <ExportMenu
              title="contatos-orbio"
              headers={["Nome", "E-mail", "Cargo", "Empresa", "Score"]}
              rows={rows.map((c) => [
                c.name,
                c.email,
                c.title,
                findCompany(companies, c.companyId)?.name ?? "",
                c.score,
              ])}
            />
            <Button variant="dark" onClick={() => setOpen(true)}>
              Novo contato
            </Button>
          </>
        }
      />
      {viewMode === "table" || viewMode === "list" ? (
      <Card padded={false} className="overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-fog-surface text-ash-helper">
            <tr>
              {["Nome", "Empresa", "Cargo", "Score", "Dono", "Último toque", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((contact) => {
              const company = findCompany(companies, contact.companyId);
              const owner = findUser(contact.ownerId);
              return (
                <tr key={contact.id} className="border-t border-stone-divider hover:bg-lavender-wash/50">
                  <td className="px-4 py-3">
                    <Link to={`/app/contacts/${contact.id}`} className="flex items-center gap-2 font-medium text-graphite-body">
                      <Avatar initials={contact.name.split(" ").map((p) => p[0]).slice(0, 2).join("")} size="sm" />
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{company?.name}</td>
                  <td className="px-4 py-3 text-slate-caption">{contact.title}</td>
                  <td className="px-4 py-3">
                    <Badge tone={healthTone(contact.score)}>{contact.score}</Badge>
                  </td>
                  <td className="px-4 py-3">{owner?.name.split(" ")[0]}</td>
                  <td className="px-4 py-3 text-ash-helper">{contact.lastTouch}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        removeContact(contact.id);
                        pushToast("Contato removido");
                      }}
                    >
                      Apagar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((contact) => {
            const company = findCompany(companies, contact.companyId);
            return (
              <Link key={contact.id} to={`/app/contacts/${contact.id}`}>
                <Card className="h-full transition-transform hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <Avatar initials={contact.name.split(" ").map((p) => p[0]).slice(0, 2).join("")} />
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      <p className="text-[12px] text-ash-helper">{contact.title}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[13px]">{company?.name}</p>
                  <p className="mt-1 text-[12px] text-ash-helper">{contact.lastTouch}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <Modal open={open} title="Novo contato" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            addContact({
              name,
              title,
              email,
              phone: "",
              companyId,
              ownerId: user?.id ?? "u1",
              location: "Brasil",
              lastTouch: new Date().toISOString().slice(0, 10),
              score: 50,
              tags: ["novo"],
            });
            pushToast("Contato criado");
            setOpen(false);
            setName("");
            setEmail("");
            setTitle("");
          }}
        >
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Cargo">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Empresa">
            <select
              className="h-11 w-full rounded-input border border-stone-divider bg-fog-surface px-3 text-[14px]"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" variant="dark" className="w-full">
            Salvar
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export function ContactDetailPage() {
  const { contacts, companies, deals, notes, addNote } = useCrm();
  const user = useAuth((s) => s.user);
  const { id = "" } = useParams();
  const contact = contacts.find((c) => c.id === id);
  const [body, setBody] = useState("");
  if (!contact) return <p>Contato não encontrado.</p>;
  const company = findCompany(companies, contact.companyId);
  const related = deals.filter((d) => d.contactId === contact.id);
  const relatedNotes = notes.filter((n) => n.relatedId === contact.id);

  return (
    <div>
      <PageHeader
        kicker="Contato"
        title={contact.name}
        description={`${contact.title} · ${company?.name}`}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Card className="p-6">
          <dl className="grid grid-cols-2 gap-4 text-[14px]">
            <div>
              <dt className="text-[12px] text-ash-helper">E-mail</dt>
              <dd className="text-royal-signal">{contact.email}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ash-helper">Telefone</dt>
              <dd>{contact.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ash-helper">Local</dt>
              <dd>{contact.location}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-ash-helper">Score</dt>
              <dd>
                <Badge tone={healthTone(contact.score)}>{contact.score}</Badge>
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            {contact.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <h3 className="mt-8 mb-3 text-[16px] font-semibold">Deals</h3>
          <div className="space-y-2">
            {related.map((deal) => (
              <Link
                key={deal.id}
                to={`/app/pipeline/${deal.id}`}
                className="flex items-center justify-between rounded-card bg-fog-surface px-3 py-2"
              >
                <span>{deal.name}</span>
                <span className="text-royal-signal">{deal.stage}</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="mb-3 text-[16px] font-semibold">Notas</h3>
          <form
            className="mb-4 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!body.trim()) return;
              addNote({
                relatedType: "contact",
                relatedId: contact.id,
                authorId: user?.id ?? "u1",
                body,
              });
              setBody("");
            }}
          >
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Registrar um insight…" />
            <Button type="submit" variant="outline" size="sm">
              Adicionar nota
            </Button>
          </form>
          <div className="space-y-3">
            {relatedNotes.map((note) => (
              <div key={note.id} className="rounded-card bg-fog-surface p-3 text-[13px]">
                <p>{note.body}</p>
                <p className="mt-1 text-[11px] text-ash-helper">{note.createdAt}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
