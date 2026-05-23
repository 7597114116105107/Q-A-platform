import { DateTime } from "luxon";

const IST = "Asia/Kolkata";
const WINDOW_START_HOUR = 10;
const WINDOW_END_HOUR = 11;

export function isPaymentWindowOpen(now = DateTime.now().setZone(IST)): boolean {
  if (process.env.PAYMENT_WINDOW_ALWAYS_OPEN === "true") {
    return true;
  }

  const minutes = now.hour * 60 + now.minute;
  const start = WINDOW_START_HOUR * 60;
  const end = WINDOW_END_HOUR * 60;
  return minutes >= start && minutes < end;
}

export function getPaymentWindowMessage(): string {
  return "Payments are accepted only between 10:00 AM and 11:00 AM IST.";
}

export function getPaymentWindowStatus() {
  const now = DateTime.now().setZone(IST);
  const open = isPaymentWindowOpen(now);

  return {
    timezone: IST,
    currentTime: now.toFormat("hh:mm a"),
    window: "10:00 AM – 11:00 AM",
    isOpen: open,
    message: open
      ? "Payment window is open. You may proceed."
      : getPaymentWindowMessage(),
  };
}
