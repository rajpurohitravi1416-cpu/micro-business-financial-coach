import test from "node:test";
import assert from "node:assert/strict";
import {
  createWhatsAppReminder,
  normalizeWhatsAppPhone,
  openWhatsAppReminder,
} from "./whatsappReminder.js";

test("normalizes Indian mobile numbers and international country codes", () => {
  assert.equal(normalizeWhatsAppPhone("98765 43210"), "919876543210");
  assert.equal(normalizeWhatsAppPhone("+91 (98765) 43210"), "919876543210");
  assert.equal(normalizeWhatsAppPhone("0044 20 7946 0958"), "442079460958");
  assert.equal(normalizeWhatsAppPhone("1-202-555-0100"), "12025550100");
});

test("launches WhatsApp in a new tab with the generated prefilled URL", () => {
  const reminder = createWhatsAppReminder({
    phone: "9876543210",
    customerName: "Asha",
    shopName: "Corner Shop",
    outstandingAmount: 50,
    dueDate: "2026-11-28",
  });
  const anchor = { clickCount: 0, click() { this.clickCount += 1; } };
  const documentStub = { createElement: tag => { assert.equal(tag, "a"); return anchor; } };

  openWhatsAppReminder(reminder.url, documentStub);

  assert.equal(anchor.href, reminder.url);
  assert.equal(anchor.target, "_blank");
  assert.equal(anchor.rel, "noopener noreferrer");
  assert.equal(anchor.clickCount, 1);
});

test("reports missing and malformed customer phone numbers", () => {
  assert.throws(() => normalizeWhatsAppPhone(null), /no saved phone number/i);
  assert.throws(() => normalizeWhatsAppPhone("12345"), /invalid/i);
  assert.throws(() => normalizeWhatsAppPhone("1234567890"), /invalid/i);
  assert.throws(() => normalizeWhatsAppPhone("12345678"), /invalid/i);
  assert.throws(() => normalizeWhatsAppPhone("not a phone"), /invalid/i);
});

test("creates a prefilled URL with saved names, outstanding balance and due date", () => {
  const reminder = createWhatsAppReminder({
    phone: "+91 98765 43210",
    customerName: "Asha Rao",
    shopName: "Rao General Store",
    outstandingAmount: 1250.5,
    dueDate: "2026-11-28T00:00:00",
  });

  assert.equal(reminder.phone, "919876543210");
  assert.match(reminder.url, /^https:\/\/wa\.me\/919876543210\?text=/);
  const decoded = new URL(reminder.url).searchParams.get("text");
  assert.equal(decoded, reminder.message);
  assert.match(decoded, /Hello Asha Rao/);
  assert.match(decoded, /Rao General Store/);
  assert.match(decoded, /₹1,250\.5/);
  assert.match(decoded, /28 Nov 2026/);
  assert.match(decoded, /Kindly make the payment when convenient/);
});
