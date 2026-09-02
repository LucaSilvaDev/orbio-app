import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { Reveal } from "@/components/motion/Reveal";
import { useCrm } from "@/store/useCrm";
import { useUi } from "@/store/useUi";
import { brl } from "@/lib/cn";
import { findCompany } from "@/lib/records";
import { downloadBlob, formatBytes, MAX_DOC_FILE } from "@/lib/files";
import { dropWorkspaceFile, getWorkspaceFile, putWorkspaceFile } from "@/services/blobs";
import { isOfficialCloud } from "@/services/core";
import type { Invoice, InvoiceStatus } from "@/types";

const tone: Record<InvoiceStatus, "neutral" | "blue" | "mint" | "coral"> = {
  draft: "neutral",
  sent: "blue",
  paid: "mint",
  overdue: "coral",
};

const label: Record<InvoiceStatus, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  paid: "Paga",
  overdue: "Atrasada",
};

export function InvoicesPage() {
  const { invoices, companies, deals, addInvoice, updateInvoice, removeInvoice } = useCrm();
  const pushToast = useUi((s) => s.pushToast);
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState(`INV-${String(invoices.length + 120).padStart(3, "0")}`);
  const [amount, setAmount] = useState("48000");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [boleto, setBoleto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const total = invoices.reduce((sum, i) => sum + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const official = isOfficialCloud();

  async function downloadBoleto(invoice: Invoice) {
    if (!invoice.filePath) return;
    const blob = await getWorkspaceFile(invoice.filePath);
    if (!blob) {
      pushToast("Não deu para baixar o boleto");
      return;
    }
    downloadBlob(invoice.fileName || invoice.number, blob);
  }

  async function remove(invoice: Invoice) {
    if (invoice.filePath) await dropWorkspaceFile(invoice.filePath);
    removeInvoice(invoice.id);
    pushToast("Fatura removida");
  }

  return (
    <div>
      <PageHeader
        kicker="Receita"
        title="Faturas"
        description="Do rascunho ao caixa — com atraso visível."
        actions={
          <>
            <ExportMenu
              title="faturas-orbio"
              headers={["Número", "Empresa", "Valor", "Emissão", "Vencimento", "Status"]}
              rows={invoices.map((i) => [
                i.number,
                findCompany(companies, i.companyId)?.name ?? "",
                i.amount,
                i.issuedAt,
                i.dueAt,
                label[i.status],
              ])}
            />
            <Button variant="dark" onClick={() => setOpen(true)}>
              Nova fatura
            </Button>
          </>
        }
      />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Reveal>
          <Card>
            <p className="text-[12px] text-ash-helper">Emitido</p>
            <p className="font-mono text-[22px]">{brl.format(total)}</p>
          </Card>
        </Reveal>
        <Reveal delay={0.06}>
          <Card>
            <p className="text-[12px] text-ash-helper">Em atraso</p>
            <p className="font-mono text-[22px] text-coral-lost">{brl.format(overdue)}</p>
          </Card>
        </Reveal>
      </div>
      <Card padded={false} className="overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-fog-surface text-ash-helper">
            <tr>
              {["Número", "Empresa", "Valor", "Emissão", "Vencimento", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-stone-divider">
                <td className="px-4 py-3 font-medium">{invoice.number}</td>
                <td className="px-4 py-3">{findCompany(companies, invoice.companyId)?.name}</td>
                <td className="px-4 py-3 text-royal-signal">{brl.format(invoice.amount)}</td>
                <td className="px-4 py-3">{invoice.issuedAt}</td>
                <td className="px-4 py-3">{invoice.dueAt}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-input border border-stone-divider bg-transparent px-2 py-1"
                    value={invoice.status}
                    onChange={(e) => {
                      updateInvoice(invoice.id, { status: e.target.value as InvoiceStatus });
                      pushToast("Status da fatura atualizado");
                    }}
                  >
                    {Object.entries(label).map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                  <Badge className="ml-2" tone={tone[invoice.status]}>
                    {label[invoice.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {invoice.filePath ? (
                    <Button size="sm" variant="ghost" onClick={() => void downloadBoleto(invoice)}>
                      Boleto
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => void remove(invoice)}>
                    Apagar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={open} title="Nova fatura" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (boleto && boleto.size > MAX_DOC_FILE) {
              pushToast("Arquivo maior que 20 MB");
              return;
            }
            const today = new Date().toISOString().slice(0, 10);
            const id = addInvoice({
              number,
              companyId,
              dealId: deals[0]?.id ?? "",
              amount: Number(amount) || 0,
              status: "draft",
              issuedAt: today,
              dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
            });
            setOpen(false);
            const file = boleto;
            setBoleto(null);
            if (!file || !official) {
              pushToast("Fatura criada");
              return;
            }
            setSaving(true);
            try {
              const stored = await putWorkspaceFile("invoices", id, file, file.name, file.type);
              updateInvoice(id, {
                filePath: stored.path,
                fileName: file.name,
                fileMime: file.type || "application/octet-stream",
                fileHash: stored.hash,
                fileSize: stored.size,
              });
              pushToast("Fatura e boleto gravados");
            } catch (error) {
              pushToast(error instanceof Error ? error.message : "Fatura criada, boleto não subiu");
            } finally {
              setSaving(false);
            }
          }}
        >
          <Field label="Número">
            <Input value={number} onChange={(e) => setNumber(e.target.value)} required />
          </Field>
          <Field label="Empresa">
            <select
              className="h-8 w-full rounded-input border border-stone-divider px-2 text-[13px]"
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
          <Field label="Valor (BRL)">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Boleto ou PDF">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="w-full text-[13px]"
              onChange={(event) => setBoleto(event.target.files?.[0] ?? null)}
            />
            {boleto ? (
              <p className="mt-1 text-[12px] text-ash-helper">
                {boleto.name} · {formatBytes(boleto.size)}
              </p>
            ) : (
              <p className="mt-1 text-[12px] text-ash-helper">
                {official
                  ? "Vai para o bucket, não para este navegador."
                  : "Anexo na nuvem só em produção."}
              </p>
            )}
          </Field>
          <Button type="submit" variant="dark" className="w-full" disabled={saving}>
            {saving ? "Gravando…" : "Salvar"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
