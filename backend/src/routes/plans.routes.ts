import { Router } from "express";
import { PLANS } from "../config/plans.js";
import { getPaymentWindowStatus } from "../config/paymentWindow.js";

const router = Router();

router.get("/", (_req, res) => {
  const plans = Object.values(PLANS).map((plan) => ({
    id: plan.id,
    name: plan.name,
    priceInr: plan.priceInr,
    questionsPerDay: plan.questionsPerDay,
    description: plan.description,
    isPaid: plan.priceInr > 0,
  }));

  res.json({
    plans,
    paymentWindow: getPaymentWindowStatus(),
  });
});

export default router;
