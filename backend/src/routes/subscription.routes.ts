import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { getSubscriptionSummary } from "../services/subscription.service.js";
import { getDailyQuestionUsage } from "../services/questionLimit.service.js";

const router = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId;
    const subscription = await getSubscriptionSummary(userId);
    const usage = await getDailyQuestionUsage(userId);

    res.json({
      subscription,
      usage: {
        usedToday: usage.usedToday,
        limit: usage.limit,
        remaining: usage.remaining,
        isUnlimited: usage.isUnlimited,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
