export type PipelineStage =
  | "qualification"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type LeadStatus = "new" | "working" | "qualified" | "unqualified";
export type ActivityType = "call" | "email" | "meeting" | "task" | "note";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
export type CampaignStatus = "draft" | "active" | "paused" | "ended";
export type DealPriority = "low" | "medium" | "high";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarHue: number;
  initials: string;
};

export type Company = {
  id: string;
  name: string;
  domain: string;
  cnpj: string;
  industry: string;
  employees: string;
  city: string;
  country: string;
  arr: number;
  health: number;
  ownerId: string;
  tags: string[];
  createdAt: string;
};

export type Contact = {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  companyId: string;
  ownerId: string;
  location: string;
  lastTouch: string;
  score: number;
  tags: string[];
};

export type Deal = {
  id: string;
  name: string;
  companyId: string;
  contactId: string;
  ownerId: string;
  stage: PipelineStage;
  value: number;
  probability: number;
  closeDate: string;
  priority: DealPriority;
  source: string;
  nextStep: string;
  updatedAt: string;
};

export type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  score: number;
  ownerId: string;
  createdAt: string;
};

export type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  relatedType: "deal" | "contact" | "company" | "lead";
  relatedId: string;
  ownerId: string;
  dueAt: string;
  done: boolean;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  billing: "monthly" | "yearly" | "one-off";
  active: boolean;
};

export type Invoice = {
  id: string;
  number: string;
  companyId: string;
  dealId: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  filePath?: string;
  fileName?: string;
  fileMime?: string;
  fileHash?: string;
  fileSize?: number;
};

export type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: CampaignStatus;
  budget: number;
  spent: number;
  leads: number;
  replies: number;
};

export type DocumentKind =
  | "pdf"
  | "sheet"
  | "slide"
  | "contract"
  | "word"
  | "image"
  | "file";

export type DocumentShareMode = "private" | "people" | "team";

export type DocumentFile = {
  id: string;
  name: string;
  kind: DocumentKind;
  related: string;
  updatedAt: string;
  ownerId: string;
  size: string;
  mime?: string;
  fileName?: string;
  hasFile?: boolean;
  shareMode?: DocumentShareMode;
  sharedWith?: string[];
  storagePath?: string;
  sha256?: string;
  sizeBytes?: number;
};

export type MailThread = {
  id: string;
  from: string;
  email: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  tag: string;
};

export type ChatAttachmentKind = "image" | "sheet" | "pdf" | "file";

export type ChatAttachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: ChatAttachmentKind;
  dataUrl?: string;
  storagePath?: string;
};

export type ChatThread = {
  id: string;
  kind: "dm" | "channel";
  name?: string;
  memberIds: string[];
  unreadBy: string[];
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: string;
  attachments: ChatAttachment[];
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  userId?: string;
};

export type Note = {
  id: string;
  relatedType: "deal" | "contact" | "company" | "workspace";
  relatedId: string;
  authorId: string;
  title?: string;
  body: string;
  pinned?: boolean;
  createdAt: string;
};

export type Reminder = {
  id: string;
  title: string;
  body: string;
  dueAt: string;
  done: boolean;
  ownerId: string;
  relatedType: "deal" | "contact" | "company" | "workspace";
  relatedId: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  when: string;
  durationMin: number;
  kind: "meeting" | "call" | "block" | "reminder";
  ownerId: string;
  related?: string;
};

export type MapNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: "start" | "process" | "decision" | "end" | "idea";
  parentId?: string;
};

export type MapEdge = {
  id: string;
  from: string;
  to: string;
};
