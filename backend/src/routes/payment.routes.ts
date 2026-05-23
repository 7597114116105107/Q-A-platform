import { Router } from "express";
import { z } from "zod";
import { PlanType } from "@prisma/client";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { createPaymentOrder, confirmPayment } from "../services/payment.service.js";
import { getPaymentWindowStatus } from "../config/paymentWindow.js";
import { getSubscriptionSummary } from "../services/subscription.service.js";

const router = Router();

const createOrderSchema = z.object({
  plan: z.enum(["BRONZE", "SILVER", "GOLD"]),
});

const confirmSchema = z.object({
  orderId: z.string().min(1),
});

router.get("/window", (_req, res) => {
  res.json(getPaymentWindowStatus());
});

router.post("/create-order", requireAuth, async (req, res, next) => {
  try {
    const { plan } = createOrderSchema.parse(req.body);
    const userId = (req as AuthRequest).userId;
    const order = await createPaymentOrder(userId, plan as PlanType);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.post("/confirm", requireAuth, async (req, res, next) => {
  try {
    const { orderId } = confirmSchema.parse(req.body);
    const userId = (req as AuthRequest).userId;

    const result = await confirmPayment(userId, orderId);
    const subscription = await getSubscriptionSummary(userId);

    res.json({
      success: true,
      message: result.alreadyProcessed
        ? "Payment was already completed"
        : "Payment successful. Subscription activated.",
      invoiceNumber: result.invoiceNumber,
      subscription,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
