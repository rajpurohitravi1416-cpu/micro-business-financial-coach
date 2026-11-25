const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export function normalizeWhatsAppPhone(phone) {
  const value = String(phone ?? "").trim();
  if (!value) {
    throw new Error("This customer has no saved phone number. Add one in the customer record first.");
  }

  const compact = value.replace(/[\s().-]/g, "");
  const hasInternationalPrefix = compact.startsWith("+") || compact.startsWith("00");
  let digits = compact.startsWith("00") ? compact.slice(2) : compact.replace(/^\+/, "");

  if (!/^\d+$/.test(digits)) {
    throw new Error("This phone number is invalid. Use a number such as +91 9876543210.");
  }

  if (!hasInternationalPrefix && INDIAN_MOBILE.test(digits)) {
    digits = `91${digits}`;
  } else if (!hasInternationalPrefix && digits.length === 11 && digits.startsWith("0") && INDIAN_MOBILE.test(digits.slice(1))) {
    digits = `91${digits.slice(1)}`;
  } else if (!hasInternationalPrefix && (digits.length < 11 || digits.length > 15)) {
    throw new Error("This phone number is invalid. Use an Indian 10-digit mobile number or include the international country code.");
  }

  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) {
    throw new Error("This phone number is invalid. Use an Indian mobile number or an international number with country code.");
  }

  return digits;
}

export function formatReminderDueDate(value) {
  if (!value) return "Not specified";
  const datePart = String(value).slice(0, 10);
  const parsed = new Date(`${datePart}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "Not specified";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function createWhatsAppReminder({ phone, customerName, shopName, outstandingAmount, dueDate }) {
  const number = normalizeWhatsAppPhone(phone);
  const amount = Number(outstandingAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("There is no outstanding amount to remind this customer about.");
  }

  const name = String(customerName ?? "").trim() || "Customer";
  const shop = String(shopName ?? "").trim() || "our shop";
  const due = formatReminderDueDate(dueDate);
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount);
  const message = [
    `Hello ${name},`,
    "",
    `This is a friendly payment reminder from ${shop}.`,
    "",
    `Your pending Udhaar amount is ₹${formattedAmount}, and the due date is ${due}.`,
    "",
    "Kindly make the payment when convenient.",
    "",
    "Thank you for shopping with us!",
  ].join("\n");

  return {
    phone: number,
    message,
    url: `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
  };
}

export function openWhatsAppReminder(url, documentObject = globalThis.document) {
  const link = documentObject.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
}
