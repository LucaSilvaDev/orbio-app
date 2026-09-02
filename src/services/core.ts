import type { Company, Contact, Deal, PipelineStage, DealPriority } from "@/types";
import { getWorkspace } from "@/lib/workspace";
import { supabase } from "@/services/supabase";

let workspaceId: string | null = null;

export function currentWorkspaceId() {
  return workspaceId;
}

export function isOfficialCloud() {
  return getWorkspace() === "official" && Boolean(supabase);
}

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    domain: String(row.domain ?? ""),
    cnpj: String(row.cnpj ?? ""),
    industry: String(row.industry ?? ""),
    employees: String(row.employees ?? ""),
    city: String(row.city ?? ""),
    country: String(row.country ?? "Brasil"),
    arr: num(row.arr),
    health: num(row.health),
    ownerId: String(row.owner_id ?? ""),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    createdAt: String(row.created_at ?? "").slice(0, 10),
  };
}

function mapContact(row: Record<string, unknown>): Contact {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    title: String(row.title ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    companyId: String(row.company_id ?? ""),
    ownerId: String(row.owner_id ?? ""),
    location: String(row.location ?? ""),
    lastTouch: String(row.last_touch ?? "").slice(0, 10),
    score: num(row.score),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
  };
}

function mapDeal(row: Record<string, unknown>): Deal {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    companyId: String(row.company_id ?? ""),
    contactId: String(row.contact_id ?? ""),
    ownerId: String(row.owner_id ?? ""),
    stage: (row.stage as PipelineStage) || "qualification",
    value: num(row.value),
    probability: num(row.probability),
    closeDate: String(row.close_date ?? "").slice(0, 10),
    priority: (row.priority as DealPriority) || "medium",
    source: String(row.source ?? ""),
    nextStep: String(row.next_step ?? ""),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function bootstrapWorkspace(): Promise<string | null> {
  if (!isOfficialCloud() || !supabase) return null;
  const invite = sessionStorage.getItem("orbio-invite");
  if (invite) {
    const { data, error } = await supabase.rpc("accept_invite", { invite_token: invite });
    if (!error && data) {
      sessionStorage.removeItem("orbio-invite");
      workspaceId = String(data);
      return workspaceId;
    }
  }
  const { data, error } = await supabase.rpc("ensure_my_workspace");
  if (error || !data) return null;
  workspaceId = String(data);
  return workspaceId;
}

export async function loadCore(): Promise<{
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
} | null> {
  if (!isOfficialCloud() || !supabase) return null;
  const wid = workspaceId ?? (await bootstrapWorkspace());
  if (!wid) return null;

  const [companies, contacts, deals] = await Promise.all([
    supabase.from("companies").select("*").eq("workspace_id", wid),
    supabase.from("contacts").select("*").eq("workspace_id", wid),
    supabase.from("deals").select("*").eq("workspace_id", wid),
  ]);

  if (companies.error || contacts.error || deals.error) return null;

  return {
    companies: (companies.data ?? []).map((row) => mapCompany(row as Record<string, unknown>)),
    contacts: (contacts.data ?? []).map((row) => mapContact(row as Record<string, unknown>)),
    deals: (deals.data ?? []).map((row) => mapDeal(row as Record<string, unknown>)),
  };
}

function companyRow(item: Company) {
  return {
    id: item.id,
    workspace_id: workspaceId,
    name: item.name,
    domain: item.domain,
    cnpj: item.cnpj,
    industry: item.industry,
    employees: item.employees,
    city: item.city,
    country: item.country,
    arr: item.arr,
    health: item.health,
    owner_id: item.ownerId || null,
    tags: item.tags,
    created_at: item.createdAt || new Date().toISOString().slice(0, 10),
  };
}

function contactRow(item: Contact) {
  return {
    id: item.id,
    workspace_id: workspaceId,
    name: item.name,
    title: item.title,
    email: item.email,
    phone: item.phone,
    company_id: item.companyId || null,
    owner_id: item.ownerId || null,
    location: item.location,
    last_touch: item.lastTouch || null,
    score: item.score,
    tags: item.tags,
  };
}

function dealRow(item: Deal) {
  return {
    id: item.id,
    workspace_id: workspaceId,
    name: item.name,
    company_id: item.companyId || null,
    contact_id: item.contactId || null,
    owner_id: item.ownerId || null,
    stage: item.stage,
    value: item.value,
    probability: item.probability,
    close_date: item.closeDate || null,
    priority: item.priority,
    source: item.source,
    next_step: item.nextStep,
    updated_at: item.updatedAt,
  };
}

export function persistCompany(item: Company, mode: "upsert" | "delete" = "upsert") {
  if (!isOfficialCloud() || !supabase || !workspaceId) return;
  if (mode === "delete") {
    void supabase.from("companies").delete().eq("id", item.id);
    return;
  }
  void supabase.from("companies").upsert(companyRow(item));
}

export function persistContact(item: Contact, mode: "upsert" | "delete" = "upsert") {
  if (!isOfficialCloud() || !supabase || !workspaceId) return;
  if (mode === "delete") {
    void supabase.from("contacts").delete().eq("id", item.id);
    return;
  }
  void supabase.from("contacts").upsert(contactRow(item));
}

export function persistDeal(item: Deal, mode: "upsert" | "delete" = "upsert") {
  if (!isOfficialCloud() || !supabase || !workspaceId) return;
  if (mode === "delete") {
    void supabase.from("deals").delete().eq("id", item.id);
    return;
  }
  void supabase.from("deals").upsert(dealRow(item));
}

export function persistDealPatch(id: string, data: Partial<Deal>) {
  if (!isOfficialCloud() || !supabase || !workspaceId) return;
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.companyId !== undefined) patch.company_id = data.companyId || null;
  if (data.contactId !== undefined) patch.contact_id = data.contactId || null;
  if (data.ownerId !== undefined) patch.owner_id = data.ownerId || null;
  if (data.stage !== undefined) patch.stage = data.stage;
  if (data.value !== undefined) patch.value = data.value;
  if (data.probability !== undefined) patch.probability = data.probability;
  if (data.closeDate !== undefined) patch.close_date = data.closeDate;
  if (data.priority !== undefined) patch.priority = data.priority;
  if (data.source !== undefined) patch.source = data.source;
  if (data.nextStep !== undefined) patch.next_step = data.nextStep;
  patch.updated_at = new Date().toISOString();
  void supabase.from("deals").update(patch).eq("id", id);
}

export function persistContactPatch(id: string, data: Partial<Contact>) {
  if (!isOfficialCloud() || !supabase || !workspaceId) return;
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.title !== undefined) patch.title = data.title;
  if (data.email !== undefined) patch.email = data.email;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.companyId !== undefined) patch.company_id = data.companyId || null;
  if (data.ownerId !== undefined) patch.owner_id = data.ownerId || null;
  if (data.location !== undefined) patch.location = data.location;
  if (data.lastTouch !== undefined) patch.last_touch = data.lastTouch;
  if (data.score !== undefined) patch.score = data.score;
  if (data.tags !== undefined) patch.tags = data.tags;
  void supabase.from("contacts").update(patch).eq("id", id);
}

export function persistCompanyPatch(id: string, data: Partial<Company>) {
  if (!isOfficialCloud() || !supabase || !workspaceId) return;
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.domain !== undefined) patch.domain = data.domain;
  if (data.cnpj !== undefined) patch.cnpj = data.cnpj;
  if (data.industry !== undefined) patch.industry = data.industry;
  if (data.employees !== undefined) patch.employees = data.employees;
  if (data.city !== undefined) patch.city = data.city;
  if (data.country !== undefined) patch.country = data.country;
  if (data.arr !== undefined) patch.arr = data.arr;
  if (data.health !== undefined) patch.health = data.health;
  if (data.ownerId !== undefined) patch.owner_id = data.ownerId || null;
  if (data.tags !== undefined) patch.tags = data.tags;
  void supabase.from("companies").update(patch).eq("id", id);
}

export function newEntityId() {
  return crypto.randomUUID();
}
