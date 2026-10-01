import { create, type StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  activities as seedActivities,
  calendarEvents as seedEvents,
  campaigns as seedCampaigns,
  chatMessages as seedChatMessages,
  chatThreads as seedChatThreads,
  companies as seedCompanies,
  contacts as seedContacts,
  deals as seedDeals,
  documents as seedDocuments,
  flowEdges as seedFlowEdges,
  flowNodes as seedFlowNodes,
  inbox as seedInbox,
  invoices as seedInvoices,
  leads as seedLeads,
  mindNodes as seedMind,
  notes as seedNotes,
  notifications as seedNotifications,
  products as seedProducts,
  reminders as seedReminders,
  users,
} from "@/data/seed";
import type {
  Activity,
  CalendarEvent,
  Campaign,
  ChatMessage,
  ChatThread,
  Company,
  Contact,
  Deal,
  DocumentFile,
  Invoice,
  Lead,
  MailThread,
  MapEdge,
  MapNode,
  Note,
  NotificationItem,
  PipelineStage,
  Product,
  Reminder,
} from "@/types";
import { uid } from "@/lib/cn";
import { can, ROLE_LABEL, usePermissions, type Area } from "@/store/usePermissions";
import { useUi } from "@/store/useUi";
import { getWorkspace, workspaceStorage } from "@/lib/workspace";
import {
  persistCompany,
  persistCompanyPatch,
  persistContact,
  persistContactPatch,
  persistDeal,
  persistDealPatch,
} from "@/services/core";
import {
  isDurableReady,
  persistDocument,
  persistDocumentPatch,
  persistInvoice,
  persistInvoicePatch,
  persistMessage,
  persistThread,
} from "@/services/durable";
import {
  ITEM_KINDS,
  isItemsReady,
  persistItem,
  type AnyItem,
  type ItemKey,
  type ItemsPayload,
} from "@/services/items";

function patch<T extends { id: string }>(list: T[], id: string, data: Partial<T>) {
  return list.map((item) => (item.id === id ? { ...item, ...data } : item));
}

function drop<T extends { id: string }>(list: T[], id: string) {
  return list.filter((item) => item.id !== id);
}

function nextId(prefix: string) {
  return getWorkspace() === "official" ? crypto.randomUUID() : uid(prefix);
}

/** Pushes the current version of one record of a cloud-synced module to the database. */
function sync(key: ItemKey, id: string) {
  const item = (useCrm.getState()[key] as unknown as AnyItem[]).find((entry) => entry.id === id);
  if (item) persistItem(key, item);
}

function remove(key: ItemKey, id: string) {
  persistItem(key, { id }, "delete");
}

// Which role area each mutating action needs. Chat, reading mail and marking things read stay open.
const ACTION_AREA: Record<string, Area> = {
  moveDeal: "crm", updateDeal: "crm", removeDeal: "crm", addDeal: "crm", convertLead: "crm",
  addContact: "crm", updateContact: "crm", removeContact: "crm",
  addCompany: "crm", updateCompany: "crm", removeCompany: "crm",
  addInvoice: "finance", updateInvoice: "finance", removeInvoice: "finance",
  toggleActivity: "any", removeActivity: "any", addActivity: "any",
  addNote: "any", togglePinNote: "any", removeNote: "any",
  addLead: "any", updateLead: "any", removeLead: "any",
  addProduct: "any", updateProduct: "any", removeProduct: "any",
  addCampaign: "any", updateCampaign: "any", removeCampaign: "any",
  addDocument: "any", updateDocument: "any", removeDocument: "any",
  addReminder: "any", toggleReminder: "any", removeReminder: "any",
  addEvent: "any", removeEvent: "any",
  addMapNode: "any", moveMapNode: "any", updateMapNode: "any", removeMapNode: "any", addFlowEdge: "any",
};

/**
 * Wraps every mutating action: if the signed-in role isn't allowed (viewer editing,
 * salesperson touching invoices…) nothing changes locally and the user is told why.
 * Without this the screen would update while the database quietly refused the write.
 */
type Creator = StateCreator<CrmState, [["zustand/persist", unknown]], []>;

function guarded(creator: Creator): Creator {
  return (set, get, api) => {
    const state = creator(set, get, api) as unknown as Record<string, unknown>;
    for (const [name, area] of Object.entries(ACTION_AREA)) {
      const original = state[name];
      if (typeof original !== "function") continue;
      state[name] = (...args: unknown[]) => {
        const role = usePermissions.getState().role;
        if (!can(role, area)) {
          useUi.getState().pushToast(`Seu papel (${role ? ROLE_LABEL[role] : "—"}) não permite esta ação.`);
          return name.startsWith("add") && name !== "addFlowEdge" ? "" : undefined;
        }
        return (original as (...a: unknown[]) => unknown)(...args);
      };
    }
    return state as unknown as CrmState;
  };
}

type CrmState = {
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  leads: Lead[];
  activities: Activity[];
  products: Product[];
  invoices: Invoice[];
  campaigns: Campaign[];
  documents: DocumentFile[];
  inbox: MailThread[];
  threads: ChatThread[];
  messages: ChatMessage[];
  notifications: NotificationItem[];
  notes: Note[];
  reminders: Reminder[];
  calendarEvents: CalendarEvent[];
  flowNodes: MapNode[];
  flowEdges: MapEdge[];
  mindNodes: MapNode[];
  hydrateCore: (payload: {
    companies: Company[];
    contacts: Contact[];
    deals: Deal[];
    documents?: DocumentFile[];
    invoices?: Invoice[];
    threads?: ChatThread[];
    messages?: ChatMessage[];
    items?: ItemsPayload;
  }) => void;
  moveDeal: (id: string, stage: PipelineStage) => void;
  updateDeal: (id: string, data: Partial<Deal>) => void;
  removeDeal: (id: string) => void;
  toggleActivity: (id: string) => void;
  removeActivity: (id: string) => void;
  markMailRead: (id: string) => void;
  sendMessage: (
    threadId: string,
    authorId: string,
    body: string,
    attachments?: ChatMessage["attachments"],
    id?: string,
  ) => void;
  markThreadRead: (threadId: string, userId: string) => void;
  openDm: (a: string, b: string) => string;
  createChannel: (name: string, memberIds: string[]) => string;
  markAllNotifications: (userId?: string) => void;
  addNote: (note: Omit<Note, "id" | "createdAt">) => void;
  togglePinNote: (id: string) => void;
  removeNote: (id: string) => void;
  addContact: (contact: Omit<Contact, "id">) => void;
  updateContact: (id: string, data: Partial<Contact>) => void;
  removeContact: (id: string) => void;
  addCompany: (company: Omit<Company, "id">) => void;
  updateCompany: (id: string, data: Partial<Company>) => void;
  removeCompany: (id: string) => void;
  addDeal: (deal: Omit<Deal, "id" | "updatedAt">) => void;
  addLead: (lead: Omit<Lead, "id" | "createdAt">) => void;
  updateLead: (id: string, data: Partial<Lead>) => void;
  removeLead: (id: string) => void;
  convertLead: (id: string) => void;
  addActivity: (activity: Omit<Activity, "id">) => void;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, "id">) => string;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  removeInvoice: (id: string) => void;
  addCampaign: (campaign: Omit<Campaign, "id">) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  removeCampaign: (id: string) => void;
  addDocument: (doc: Omit<DocumentFile, "id"> & { id?: string }) => string;
  updateDocument: (id: string, data: Partial<DocumentFile>) => void;
  removeDocument: (id: string) => void;
  addNotification: (item: Omit<NotificationItem, "id">) => void;
  addReminder: (item: Omit<Reminder, "id">) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;
  addEvent: (item: Omit<CalendarEvent, "id">) => void;
  removeEvent: (id: string) => void;
  addMapNode: (scope: "flow" | "mind", node: Omit<MapNode, "id">) => string;
  moveMapNode: (scope: "flow" | "mind", id: string, x: number, y: number) => void;
  updateMapNode: (scope: "flow" | "mind", id: string, data: Partial<MapNode>) => void;
  removeMapNode: (scope: "flow" | "mind", id: string) => void;
  addFlowEdge: (from: string, to: string) => void;
};

const seededCrm = {
  contacts: seedContacts,
  companies: seedCompanies,
  deals: seedDeals,
  leads: seedLeads,
  activities: seedActivities,
  products: seedProducts,
  invoices: seedInvoices,
  campaigns: seedCampaigns,
  documents: seedDocuments,
  inbox: seedInbox,
  threads: seedChatThreads,
  messages: seedChatMessages,
  notifications: seedNotifications,
  notes: seedNotes,
  reminders: seedReminders,
  calendarEvents: seedEvents,
  flowNodes: seedFlowNodes,
  flowEdges: seedFlowEdges,
  mindNodes: seedMind,
};

const emptyCrm = {
  contacts: [],
  companies: [],
  deals: [],
  leads: [],
  activities: [],
  products: [],
  invoices: [],
  campaigns: [],
  documents: [],
  inbox: [],
  threads: [],
  messages: [],
  notifications: [],
  notes: [],
  reminders: [],
  calendarEvents: [],
  flowNodes: [],
  flowEdges: [],
  mindNodes: [],
};

export const useCrm = create<CrmState>()(
  persist(
    guarded((set, get) => ({
      ...(getWorkspace() === "official" ? emptyCrm : seededCrm),
      hydrateCore: (payload) =>
        set({
          companies: payload.companies,
          contacts: payload.contacts,
          deals: payload.deals,
          ...(payload.documents ? { documents: payload.documents } : {}),
          ...(payload.invoices ? { invoices: payload.invoices } : {}),
          ...(payload.threads ? { threads: payload.threads } : {}),
          ...(payload.messages ? { messages: payload.messages } : {}),
          ...(payload.items
            ? Object.fromEntries(
                (Object.keys(ITEM_KINDS) as ItemKey[])
                  .filter((key) => payload.items?.[key])
                  .map((key) => [key, payload.items![key]]),
              )
            : {}),
        }),
      moveDeal: (id, stage) => {
        const deals = get().deals.map((deal) =>
          deal.id === id
            ? {
                ...deal,
                stage,
                probability: stage === "won" ? 100 : stage === "lost" ? 0 : deal.probability,
                updatedAt: new Date().toISOString(),
              }
            : deal,
        );
        set({ deals });
        const row = deals.find((deal) => deal.id === id);
        if (row) persistDeal(row);
      },
      updateDeal: (id, data) => {
        set({ deals: patch(get().deals, id, data) });
        persistDealPatch(id, data);
      },
      removeDeal: (id) => {
        const row = get().deals.find((deal) => deal.id === id);
        set({ deals: drop(get().deals, id) });
        if (row) persistDeal(row, "delete");
      },
      toggleActivity: (id) => {
        set({
          activities: get().activities.map((item) =>
            item.id === id ? { ...item, done: !item.done } : item,
          ),
        });
        sync("activities", id);
      },
      removeActivity: (id) => {
        set({ activities: drop(get().activities, id) });
        remove("activities", id);
      },
      markMailRead: (id) =>
        set({
          inbox: get().inbox.map((mail) =>
            mail.id === id ? { ...mail, unread: false } : mail,
          ),
        }),
      sendMessage: (threadId, authorId, body, attachments = [], id) => {
        const thread = get().threads.find((item) => item.id === threadId);
        if (!thread) return;
        const now = new Date().toISOString();
        const message: ChatMessage = {
          id: id ?? nextId("cm"),
          threadId,
          authorId,
          body,
          createdAt: now,
          attachments,
        };
        const nextThread: ChatThread = {
          ...thread,
          updatedAt: now,
          unreadBy: thread.memberIds.filter((memberId) => memberId !== authorId),
        };
        set({
          messages: [...get().messages, message],
          threads: patch(get().threads, threadId, {
            updatedAt: now,
            unreadBy: nextThread.unreadBy,
          }),
        });
        persistMessage(message);
        persistThread(nextThread);
      },
      markThreadRead: (threadId, userId) => {
        const thread = get().threads.find((item) => item.id === threadId);
        if (!thread || !thread.unreadBy.includes(userId)) return;
        const next = {
          unreadBy: thread.unreadBy.filter((id) => id !== userId),
        };
        set({
          threads: patch(get().threads, threadId, next),
        });
        persistThread({ ...thread, ...next });
      },
      openDm: (a, b) => {
        const existing = get().threads.find(
          (thread) =>
            thread.kind === "dm" &&
            thread.memberIds.includes(a) &&
            thread.memberIds.includes(b) &&
            thread.memberIds.length === 2,
        );
        if (existing) return existing.id;
        const id = nextId("th");
        const row: ChatThread = {
          id,
          kind: "dm",
          memberIds: [a, b],
          unreadBy: [],
          updatedAt: new Date().toISOString(),
        };
        set({
          threads: [row, ...get().threads],
        });
        persistThread(row);
        return id;
      },
      createChannel: (name, memberIds) => {
        const id = nextId("ch");
        const row: ChatThread = {
          id,
          kind: "channel",
          name,
          memberIds,
          unreadBy: [],
          updatedAt: new Date().toISOString(),
        };
        set({
          threads: [row, ...get().threads],
        });
        persistThread(row);
        return id;
      },
      markAllNotifications: (userId) => {
        const changed: string[] = [];
        set({
          notifications: get().notifications.map((item) => {
            const mine = !item.userId || item.userId === userId;
            if (mine && !item.read) changed.push(item.id);
            return mine ? { ...item, read: true } : item;
          }),
        });
        changed.forEach((id) => sync("notifications", id));
      },
      addNotification: (item) => {
        const row = { ...item, id: nextId("n") };
        set({ notifications: [row, ...get().notifications] });
        persistItem("notifications", row);
      },
      addNote: (note) => {
        const row = { ...note, id: nextId("nt"), createdAt: new Date().toISOString() };
        set({ notes: [row, ...get().notes] });
        persistItem("notes", row);
      },
      togglePinNote: (id) => {
        set({
          notes: get().notes.map((item) =>
            item.id === id ? { ...item, pinned: !item.pinned } : item,
          ),
        });
        sync("notes", id);
      },
      removeNote: (id) => {
        set({ notes: drop(get().notes, id) });
        remove("notes", id);
      },
      addContact: (contact) => {
        const row = { ...contact, id: nextId("c") };
        set({ contacts: [row, ...get().contacts] });
        persistContact(row);
      },
      updateContact: (id, data) => {
        set({ contacts: patch(get().contacts, id, data) });
        persistContactPatch(id, data);
      },
      removeContact: (id) => {
        const row = get().contacts.find((item) => item.id === id);
        set({ contacts: drop(get().contacts, id) });
        if (row) persistContact(row, "delete");
      },
      addCompany: (company) => {
        const row = { ...company, id: nextId("co") };
        set({ companies: [row, ...get().companies] });
        persistCompany(row);
      },
      updateCompany: (id, data) => {
        set({ companies: patch(get().companies, id, data) });
        persistCompanyPatch(id, data);
      },
      removeCompany: (id) => {
        const row = get().companies.find((item) => item.id === id);
        set({ companies: drop(get().companies, id) });
        if (row) persistCompany(row, "delete");
      },
      addDeal: (deal) => {
        const row = { ...deal, id: nextId("d"), updatedAt: new Date().toISOString() };
        set({ deals: [row, ...get().deals] });
        persistDeal(row);
      },
      addLead: (lead) => {
        const row = { ...lead, id: nextId("l"), createdAt: new Date().toISOString() };
        set({ leads: [row, ...get().leads] });
        persistItem("leads", row);
      },
      updateLead: (id, data) => {
        set({ leads: patch(get().leads, id, data) });
        sync("leads", id);
      },
      removeLead: (id) => {
        set({ leads: drop(get().leads, id) });
        remove("leads", id);
      },
      convertLead: (id) => {
        const lead = get().leads.find((item) => item.id === id);
        if (!lead) return;
        const company = {
          id: nextId("co"),
          name: lead.company,
          domain: lead.email.split("@")[1] ?? "empresa.com",
          cnpj: "",
          industry: "Nova",
          employees: "1–50",
          city: "São Paulo",
          country: "Brasil",
          arr: 0,
          health: 70,
          ownerId: lead.ownerId,
          tags: ["convertido"],
          createdAt: new Date().toISOString().slice(0, 10),
        };
        const contact = {
          id: nextId("c"),
          name: lead.name,
          title: "Contato principal",
          email: lead.email,
          phone: lead.phone || "",
          companyId: company.id,
          ownerId: lead.ownerId,
          location: "Brasil",
          lastTouch: new Date().toISOString().slice(0, 10),
          score: lead.score,
          tags: ["convertido"],
        };
        const deal = {
          id: nextId("d"),
          name: `${lead.company} — oportunidade`,
          companyId: company.id,
          contactId: contact.id,
          ownerId: lead.ownerId,
          stage: "qualification" as const,
          value: 48000,
          probability: 20,
          closeDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
          priority: "medium" as const,
          source: lead.source,
          nextStep: "Discovery inicial",
          updatedAt: new Date().toISOString(),
        };
        set({
          companies: [company, ...get().companies],
          contacts: [contact, ...get().contacts],
          deals: [deal, ...get().deals],
          leads: get().leads.map((item) =>
            item.id === id ? { ...item, status: "qualified" } : item,
          ),
        });
        persistCompany(company);
        persistContact(contact);
        persistDeal(deal);
        sync("leads", id);
      },
      addActivity: (activity) => {
        const row = { ...activity, id: nextId("a") };
        set({ activities: [row, ...get().activities] });
        persistItem("activities", row);
      },
      addProduct: (product) => {
        const row = { ...product, id: nextId("p") };
        set({ products: [row, ...get().products] });
        persistItem("products", row);
      },
      updateProduct: (id, data) => {
        set({ products: patch(get().products, id, data) });
        sync("products", id);
      },
      removeProduct: (id) => {
        set({ products: drop(get().products, id) });
        remove("products", id);
      },
      addInvoice: (invoice) => {
        const row = { ...invoice, id: nextId("i") };
        set({ invoices: [row, ...get().invoices] });
        persistInvoice(row);
        return row.id;
      },
      updateInvoice: (id, data) => {
        set({ invoices: patch(get().invoices, id, data) });
        persistInvoicePatch(id, data);
      },
      removeInvoice: (id) => {
        const row = get().invoices.find((item) => item.id === id);
        set({ invoices: drop(get().invoices, id) });
        if (row) persistInvoice(row, "delete");
      },
      addCampaign: (campaign) => {
        const row = { ...campaign, id: nextId("cp") };
        set({ campaigns: [row, ...get().campaigns] });
        persistItem("campaigns", row);
      },
      updateCampaign: (id, data) => {
        set({ campaigns: patch(get().campaigns, id, data) });
        sync("campaigns", id);
      },
      removeCampaign: (id) => {
        set({ campaigns: drop(get().campaigns, id) });
        remove("campaigns", id);
      },
      addDocument: (doc) => {
        const id = doc.id ?? nextId("doc");
        const row: DocumentFile = {
          ...doc,
          id,
          shareMode: doc.shareMode ?? "private",
          sharedWith: Array.isArray(doc.sharedWith) ? doc.sharedWith : [],
        };
        set({
          documents: [row, ...get().documents],
        });
        persistDocument(row);
        return id;
      },
      updateDocument: (id, data) => {
        set({ documents: patch(get().documents, id, data) });
        persistDocumentPatch(id, data);
      },
      removeDocument: (id) => {
        const row = get().documents.find((item) => item.id === id);
        set({ documents: drop(get().documents, id) });
        if (row) persistDocument(row, "delete");
      },
      addReminder: (item) => {
        const row = { ...item, id: nextId("r") };
        set({ reminders: [row, ...get().reminders] });
        persistItem("reminders", row);
      },
      toggleReminder: (id) => {
        set({
          reminders: get().reminders.map((item) =>
            item.id === id ? { ...item, done: !item.done } : item,
          ),
        });
        sync("reminders", id);
      },
      removeReminder: (id) => {
        set({ reminders: drop(get().reminders, id) });
        remove("reminders", id);
      },
      addEvent: (item) => {
        const row = { ...item, id: nextId("e") };
        set({ calendarEvents: [row, ...get().calendarEvents] });
        persistItem("calendarEvents", row);
      },
      removeEvent: (id) => {
        set({ calendarEvents: drop(get().calendarEvents, id) });
        remove("calendarEvents", id);
      },
      addMapNode: (scope, node) => {
        const id = nextId(scope === "flow" ? "fn" : "mn");
        const key = scope === "flow" ? "flowNodes" : "mindNodes";
        set({ [key]: [...get()[key], { ...node, id }] } as Partial<CrmState>);
        sync(key, id);
        return id;
      },
      moveMapNode: (scope, id, x, y) => {
        const key = scope === "flow" ? "flowNodes" : "mindNodes";
        set({ [key]: patch(get()[key], id, { x, y }) } as Partial<CrmState>);
        sync(key, id);
      },
      updateMapNode: (scope, id, data) => {
        const key = scope === "flow" ? "flowNodes" : "mindNodes";
        set({ [key]: patch(get()[key], id, data) } as Partial<CrmState>);
        sync(key, id);
      },
      removeMapNode: (scope, id) => {
        if (scope === "flow") {
          const edges = get().flowEdges.filter((e) => e.from === id || e.to === id);
          set({
            flowNodes: drop(get().flowNodes, id),
            flowEdges: get().flowEdges.filter((e) => e.from !== id && e.to !== id),
          });
          edges.forEach((edge) => remove("flowEdges", edge.id));
          remove("flowNodes", id);
        } else {
          set({ mindNodes: drop(get().mindNodes, id) });
          remove("mindNodes", id);
        }
      },
      addFlowEdge: (from, to) => {
        const row = { id: nextId("fe"), from, to };
        set({ flowEdges: [...get().flowEdges, row] });
        persistItem("flowEdges", row);
      },
    })),
    {
      name: "orbio-crm-v2",
      storage: createJSONStorage(() => workspaceStorage),
      partialize: (state) => {
        if (getWorkspace() !== "official") return state;
        const { companies: _c, contacts: _p, deals: _d, ...rest } = state;
        // Whatever the cloud already holds is not duplicated in this browser's storage.
        const kept: Record<string, unknown> = { ...rest };
        if (isItemsReady()) for (const key of Object.keys(ITEM_KINDS)) delete kept[key];
        if (isDurableReady()) {
          for (const key of ["documents", "invoices", "threads", "messages"]) delete kept[key];
        }
        return kept as typeof rest;
      },
      merge: (persisted, current) => {
        try {
          const stored =
            persisted && typeof persisted === "object"
              ? (persisted as Partial<CrmState>)
              : {};
          const next = { ...current, ...stored };
          const list = <T,>(value: T[] | undefined) =>
            Array.isArray(value) ? value.filter(Boolean) : [];
          return {
            ...next,
            leads: list(next.leads).map((lead) => ({ ...lead, phone: lead.phone ?? "" })),
            companies: list(next.companies).map((company) => ({
              ...company,
              cnpj: company.cnpj ?? "",
            })),
            threads: list(next.threads).map((thread) => ({
              ...thread,
              unreadBy: Array.isArray(thread.unreadBy) ? thread.unreadBy : [],
            })),
            notifications: list(next.notifications),
            documents: list(next.documents).map((doc) => ({
              ...doc,
              mime: doc.mime ?? "",
              fileName: doc.fileName ?? doc.name,
              hasFile: Boolean(doc.hasFile),
              shareMode:
                doc.shareMode === "private" || doc.shareMode === "people" || doc.shareMode === "team"
                  ? doc.shareMode
                  : "team",
              sharedWith: Array.isArray(doc.sharedWith)
                ? doc.sharedWith.filter((id) => typeof id === "string")
                : [],
            })),
          };
        } catch {
          return current;
        }
      },
    },
  ),
);

export { users };
