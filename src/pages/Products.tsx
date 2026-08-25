import { useMemo, useState } from "react";
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
import type { Product } from "@/types";

const billingLabel: Record<Product["billing"], string> = {
  monthly: "mensal",
  yearly: "anual",
  "one-off": "única",
};

export function ProductsPage() {
  const { products, addProduct, updateProduct, removeProduct } = useCrm();
  const pushToast = useUi((s) => s.pushToast);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("12000");
  const [category, setCategory] = useState("Software");
  const [billing, setBilling] = useState<Product["billing"]>("monthly");
  const totals = useMemo(() => {
    const active = products.filter((item) => item.active);
    const sum = (cycle: Product["billing"]) =>
      active.filter((item) => item.billing === cycle).reduce((acc, item) => acc + item.price, 0);
    const monthly = sum("monthly");
    const yearly = sum("yearly");
    const oneOff = sum("one-off");
    return {
      count: active.length,
      paused: products.length - active.length,
      monthly,
      yearly,
      oneOff,
      arr: monthly * 12 + yearly,
    };
  }, [products]);

  return (
    <div>
      <PageHeader
        kicker="Receita"
        title="Produtos"
        description="Catálogo que alimenta propostas, faturas e forecast."
        actions={
          <>
            <ExportMenu
              title="produtos-orbio"
              headers={["SKU", "Nome", "Categoria", "Preço", "Cobrança", "Status"]}
              rows={products.map((p) => [
                p.sku,
                p.name,
                p.category,
                p.price,
                billingLabel[p.billing],
                p.active ? "ativo" : "pausado",
              ])}
            />
            <Button variant="dark" onClick={() => setOpen(true)}>
              Novo produto
            </Button>
          </>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-[11px] tracking-[0.08em] text-ash-helper uppercase">Contratados</p>
          <p className="mt-2 font-mono text-[26px] tracking-[-0.04em] text-midnight-ink">
            {totals.count}
          </p>
          <p className="mt-1 text-[12px] text-slate-caption">
            SKUs ativos
            {totals.paused ? ` · ${totals.paused} pausado${totals.paused > 1 ? "s" : ""} fora` : ""}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] tracking-[0.08em] text-ash-helper uppercase">Mensal</p>
          <p className="mt-2 font-mono text-[26px] tracking-[-0.04em] text-royal-signal">
            {brl.format(totals.monthly)}
          </p>
          <p className="mt-1 text-[12px] text-slate-caption">Recorrência / mês</p>
        </Card>
        <Card>
          <p className="text-[11px] tracking-[0.08em] text-ash-helper uppercase">Anual + avulso</p>
          <p className="mt-2 font-mono text-[26px] tracking-[-0.04em] text-midnight-ink">
            {brl.format(totals.yearly + totals.oneOff)}
          </p>
          <p className="mt-1 text-[12px] text-slate-caption">
            {brl.format(totals.yearly)} / ano · {brl.format(totals.oneOff)} único
          </p>
        </Card>
        <Card>
          <p className="text-[11px] tracking-[0.08em] text-ash-helper uppercase">ARR equivalente</p>
          <p className="mt-2 font-mono text-[26px] tracking-[-0.04em] text-royal-signal">
            {brl.format(totals.arr)}
          </p>
          <p className="mt-1 text-[12px] text-slate-caption">Mensal × 12 + contratos anuais</p>
        </Card>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product, i) => (
          <Reveal key={product.id} delay={i * 0.04}>
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] text-ash-helper">{product.sku}</p>
                  <h2 className="text-[16px] font-semibold">{product.name}</h2>
                </div>
                <Badge tone={product.active ? "mint" : "neutral"}>
                  {product.active ? "ativo" : "pausado"}
                </Badge>
              </div>
              <p className="mt-4 font-mono text-[22px] tracking-[-0.04em] text-royal-signal">
                {brl.format(product.price)}
              </p>
              <p className="mt-1 text-[13px] text-slate-caption">
                {product.category} · cobrança {billingLabel[product.billing]}
              </p>
              <div className="mt-4 flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    updateProduct(product.id, { active: !product.active });
                    pushToast(product.active ? "Produto pausado" : "Produto ativado");
                  }}
                >
                  {product.active ? "Pausar" : "Ativar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeProduct(product.id)}>
                  Apagar
                </Button>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
      <Modal open={open} title="Novo produto" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            addProduct({
              name,
              sku: sku || `SKU-${products.length + 1}`,
              category,
              price: Number(price) || 0,
              billing,
              active: true,
            });
            pushToast("Produto no catálogo");
            setOpen(false);
            setName("");
            setSku("");
            setBilling("monthly");
          }}
        >
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="SKU">
            <Input value={sku} onChange={(e) => setSku(e.target.value)} />
          </Field>
          <Field label="Categoria">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="Preço (BRL)">
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Cobrança">
            <select
              className="h-10 w-full rounded-pill bg-fog-surface px-4 text-[13px]"
              value={billing}
              onChange={(e) => setBilling(e.target.value as Product["billing"])}
            >
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
              <option value="one-off">Única</option>
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
