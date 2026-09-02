import { create } from "zustand";
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

function patch<T extends { id: string }>(list: T[], id: string, data: Partial<T>) {
  return list.map((item) => (item.id === id ? { ...item, ...data } : item));
}

function drop<T extends { id: string }>(list: T[], id: string) {
  return list.filter((item) => item.id !== id);
}

function nextId(prefix: string) {
  return getWorkspace() === "official" ? crypto.randomUUID() : uid(prefix);
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
    (set, get) => ({
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
      toggleActivity: (id) =>
        set({
          activities: get().activities.map((item) =>
            item.id === id ? { ...item, done: !item.done } : item,
          ),
        }),
      removeActivity: (id) => set({ activities: drop(get().activities, id) }),
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
      markAllNotifications: (userId) =>
        set({
          notifications: get().notifications.map((item) => {
            const mine = !item.userId || item.userId === userId;
            return mine ? { ...item, read: true } : item;
          }),
        }),
      addNotification: (item) =>
        set({
          notifications: [{ ...item, id: uid("n") }, ...get().notifications],
        }),
      addNote: (note) =>
        set({
          notes: [{ ...note, id: uid("nt"), createdAt: new Date().toISOString() }, ...get().notes],
        }),
      togglePinNote: (id) =>
        set({
          notes: get().notes.map((item) =>
            item.id === id ? { ...item, pinned: !item.pinned } : item,
          ),
        }),
      removeNote: (id) => set({ notes: drop(get().notes, id) }),
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
      addLead: (lead) =>
        set({
          leads: [{ ...lead, id: uid("l"), createdAt: new Date().toISOString() }, ...get().leads],
        }),
      updateLead: (id, data) => set({ leads: patch(get().leads, id, data) }),
      removeLead: (id) => set({ leads: drop(get().leads, id) }),
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
      },
      addActivity: (activity) =>
        set({ activities: [{ ...activity, id: uid("a") }, ...get().activities] }),
      addProduct: (product) =>
        set({ products: [{ ...product, id: uid("p") }, ...get().products] }),
      updateProduct: (id, data) => set({ products: patch(get().products, id, data) }),
      removeProduct: (id) => set({ products: drop(get().products, id) }),
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
      addCampaign: (campaign) =>
        set({ campaigns: [{ ...campaign, id: uid("cp") }, ...get().campaigns] }),
      updateCampaign: (id, data) => set({ campaigns: patch(get().campaigns, id, data) }),
      removeCampaign: (id) => set({ campaigns: drop(get().campaigns, id) }),
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
      addReminder: (item) =>
        set({ reminders: [{ ...item, id: uid("r") }, ...get().reminders] }),
      toggleReminder: (id) =>
        set({
          reminders: get().reminders.map((item) =>
            item.id === id ? { ...item, done: !item.done } : item,
          ),
        }),
      removeReminder: (id) => set({ reminders: drop(get().reminders, id) }),
      addEvent: (item) =>
        set({ calendarEvents: [{ ...item, id: uid("e") }, ...get().calendarEvents] }),
      removeEvent: (id) => set({ calendarEvents: drop(get().calendarEvents, id) }),
      addMapNode: (scope, node) => {
        const id = uid(scope === "flow" ? "fn" : "mn");
        if (scope === "flow") set({ flowNodes: [...get().flowNodes, { ...node, id }] });
        else set({ mindNodes: [...get().mindNodes, { ...node, id }] });
        return id;
      },
      moveMapNode: (scope, id, x, y) => {
        if (scope === "flow") set({ flowNodes: patch(get().flowNodes, id, { x, y }) });
        else set({ mindNodes: patch(get().mindNodes, id, { x, y }) });
      },
      updateMapNode: (scope, id, data) => {
        if (scope === "flow") set({ flowNodes: patch(get().flowNodes, id, data) });
        else set({ mindNodes: patch(get().mindNodes, id, data) });
      },
      removeMapNode: (scope, id) => {
        if (scope === "flow") {
          set({
            flowNodes: drop(get().flowNodes, id),
            flowEdges: get().flowEdges.filter((e) => e.from !== id && e.to !== id),
          });
        } else {
          set({ mindNodes: drop(get().mindNodes, id) });
        }
      },
      addFlowEdge: (from, to) =>
        set({ flowEdges: [...get().flowEdges, { id: uid("fe"), from, to }] }),
    }),
    {
      name: "orbio-crm-v2",
      storage: createJSONStorage(() => workspaceStorage),
      partialize: (state) => {
        if (getWorkspace() !== "official") return state;
        const { companies: _c, contacts: _p, deals: _d, ...rest } = state;
        if (!isDurableReady()) return rest;
        const {
          documents: _docs,
          invoices: _inv,
          threads: _th,
          messages: _msg,
          ...local
        } = rest;
        return local;
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
