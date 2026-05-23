import nodemailer from "nodemailer";
import { PlanType } from "@prisma/client";
import { getPlan } from "../config/plans.js";
import { DateTime } from "luxon";

type InvoiceEmailInput = {
  to: string;
  userName: string;
  plan: PlanType;
  amountPaise: number;
  invoiceNumber: string;
  transactionId: string;
  paidAt: Date;
  expiresAt: Date;
};

function formatInr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function buildInvoiceHtml(data: InvoiceEmailInput): string {
  const plan = getPlan(data.plan);
  const paidAt = DateTime.fromJSDate(data.paidAt)
    .setZone("Asia/Kolkata")
    .toFormat("dd MMM yyyy, hh:mm a");
  const expiresAt = DateTime.fromJSDate(data.expiresAt)
    .setZone("Asia/Kolkata")
    .toFormat("dd MMM yyyy");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="color: #2563eb;">Payment Successful</h2>
      <p>Hi ${data.userName},</p>
      <p>Thank you for subscribing to the <strong>${plan.name}</strong>. Your payment was received successfully.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr><td style="padding: 8px 0; color: #666;">Invoice Number</td><td style="padding: 8px 0;"><strong>${data.invoiceNumber}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Transaction ID</td><td style="padding: 8px 0;">${data.transactionId}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Plan</td><td style="padding: 8px 0;">${plan.name}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Amount Paid</td><td style="padding: 8px 0;">${formatInr(data.amountPaise)}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Paid On</td><td style="padding: 8px 0;">${paidAt} IST</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Valid Until</td><td style="padding: 8px 0;">${expiresAt}</td></tr>
      </table>

      <h3>Your plan benefits</h3>
      <p>${plan.description}</p>
      <ul>
        <li>Daily question limit: ${plan.questionsPerDay === null ? "Unlimited" : plan.questionsPerDay}</li>
        <li>Billing cycle: Monthly</li>
      </ul>

      <p style="color: #666; font-size: 13px; margin-top: 32px;">
        This email serves as your invoice. For support, reply to this message.
      </p>
    </div>
  `;
}

export async function sendSubscriptionInvoiceEmail(data: InvoiceEmailInput) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM ?? user;

  if (!host || !user || !pass) {
    console.warn("[email] SMTP not configured — skipping invoice email");
    return { sent: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user, pass },
  });

  const plan = getPlan(data.plan);

  await transporter.sendMail({
    from,
    to: data.to,
    subject: `Invoice ${data.invoiceNumber} — ${plan.name} activated`,
    html: buildInvoiceHtml(data),
    text: [
      `Hi ${data.userName},`,
      "",
      `Your ${plan.name} subscription is now active.`,
      `Invoice: ${data.invoiceNumber}`,
      `Amount: ${formatInr(data.amountPaise)}`,
      `Transaction ID: ${data.transactionId}`,
      `Valid until: ${data.expiresAt.toDateString()}`,
      "",
      plan.description,
    ].join("\n"),
  });

  return { sent: true };
}
