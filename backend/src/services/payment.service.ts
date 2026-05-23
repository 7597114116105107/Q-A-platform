import { randomBytes } from "crypto";
import { PlanType, PaymentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { getPlan, isPaidPlan } from "../config/plans.js";
import {
  getPaymentWindowMessage,
  isPaymentWindowOpen,
} from "../config/paymentWindow.js";
import { generateInvoiceNumber } from "../utils/dates.js";
import { activatePaidSubscription } from "./subscription.service.js";
import { sendSubscriptionInvoiceEmail } from "./email.service.js";

function assertPaymentWindow() {
  if (!isPaymentWindowOpen()) {
    throw new AppError(getPaymentWindowMessage(), 403, "PAYMENT_WINDOW_CLOSED");
  }
}

function createOrderId(): string {
  return `ord_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function createTransactionId(): string {
  return `txn_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

export async function createPaymentOrder(userId: string, plan: PlanType) {
  assertPaymentWindow();

  if (!isPaidPlan(plan)) {
    throw new AppError("This plan does not require payment", 400);
  }

  const planDef = getPlan(plan);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const orderId = createOrderId();
  const invoiceNumber = generateInvoiceNumber();

  await prisma.payment.create({
    data: {
      userId,
      plan,
      amountPaise: planDef.pricePaise,
      razorpayOrderId: orderId,
      invoiceNumber,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    orderId,
    amount: planDef.pricePaise,
    amountInr: planDef.priceInr,
    currency: "INR",
    invoiceNumber,
    plan: {
      id: planDef.id,
      name: planDef.name,
      priceInr: planDef.priceInr,
      description: planDef.description,
    },
  };
}

export async function confirmPayment(userId: string, orderId: string) {
  assertPaymentWindow();

  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId: orderId, userId },
    include: { user: true },
  });

  if (!payment) {
    throw new AppError("Payment order not found", 404);
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { expiresAt: "desc" },
    });
    return {
      alreadyProcessed: true,
      payment,
      invoiceNumber: payment.invoiceNumber,
      expiresAt: subscription?.expiresAt ?? null,
    };
  }

  const paidAt = new Date();
  const transactionId = createTransactionId();
  const subscription = await activatePaidSubscription(userId, payment.plan);

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.COMPLETED,
      razorpayPaymentId: transactionId,
      paidAt,
    },
  });

  try {
    await sendSubscriptionInvoiceEmail({
      to: payment.user.email,
      userName: payment.user.name,
      plan: payment.plan,
      amountPaise: payment.amountPaise,
      invoiceNumber: payment.invoiceNumber,
      transactionId,
      paidAt,
      expiresAt: subscription.expiresAt,
    });
  } catch (err) {
    console.error("[email] Failed to send invoice:", err);
  }

  return {
    alreadyProcessed: false,
    payment: updatedPayment,
    subscription,
    invoiceNumber: payment.invoiceNumber,
    expiresAt: subscription.expiresAt,
  };
}
