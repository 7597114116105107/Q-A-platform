import { DateTime } from "luxon";

const IST = "Asia/Kolkata";

export function getTodayRangeInIst() {
  const now = DateTime.now().setZone(IST);
  const start = now.startOf("day").toUTC().toJSDate();
  const end = now.endOf("day").toUTC().toJSDate();
  return { start, end };
}

export function addOneMonth(date = new Date()): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export function generateInvoiceNumber(): string {
  const stamp = DateTime.now().setZone(IST).toFormat("yyyyMMdd");
  const random = Math.floor(100000 + Math.random() * 900000);
  return `INV-${stamp}-${random}`;
}
