export interface WhatsAppReminderInput {
  phone: string | null | undefined;
  customerName: string;
  shopName: string;
  outstandingAmount: number;
  dueDate: string | null | undefined;
}

export function normalizeWhatsAppPhone(phone: string | null | undefined): string;
export function formatReminderDueDate(value: string | null | undefined): string;
export function createWhatsAppReminder(input: WhatsAppReminderInput): {
  phone: string;
  message: string;
  url: string;
};
export function openWhatsAppReminder(url: string, documentObject?: Document): void;
