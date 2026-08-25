import type { Company, Contact, Deal, User } from "@/types";
import { listUsers } from "@/lib/directory";

export function findUser(id: string): User | undefined {
  return listUsers().find((user) => user.id === id);
}

export function findCompany(companies: Company[], id: string) {
  return companies.find((company) => company.id === id);
}

export function findContact(contacts: Contact[], id: string) {
  return contacts.find((contact) => contact.id === id);
}

export function findDeal(deals: Deal[], id: string) {
  return deals.find((deal) => deal.id === id);
}

export function healthTone(score: number) {
  if (score >= 80) return "mint" as const;
  if (score >= 60) return "amber" as const;
  return "coral" as const;
}
