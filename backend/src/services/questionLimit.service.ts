import { PlanType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { getPlan } from "../config/plans.js";
import { AppError } from "../lib/errors.js";
import { getTodayRangeInIst } from "../utils/dates.js";
import {
  ensureFreeSubscription,
  getActiveSubscription,
} from "./subscription.service.js";

export async function getDailyQuestionUsage(userId: string) {
  let subscription = await getActiveSubscription(userId);
  if (!subscription) {
    subscription = await ensureFreeSubscription(userId);
  }

  const planDef = getPlan(subscription.plan);
  const { start, end } = getTodayRangeInIst();
  const usedToday = await prisma.question.count({
    where: {
      userId,
      createdAt: { gte: start, lte: end },
    },
  });

  const limit = planDef.questionsPerDay;
  const remaining =
    limit === null ? null : Math.max(0, limit - usedToday);

  return {
    plan: subscription.plan,
    limit,
    usedToday,
    remaining,
    isUnlimited: limit === null,
  };
}

export async function checkQuestionPostingAllowed(userId: string) {
  const usage = await getDailyQuestionUsage(userId);
  const planDef = getPlan(usage.plan);

  if (usage.isUnlimited) {
    return {
      allowed: true,
      plan: usage.plan,
      limit: null as number | null,
      usedToday: usage.usedToday,
      remaining: null as number | null,
    };
  }

  if ((usage.remaining ?? 0) <= 0) {
    throw new AppError(
      `Daily limit reached. Your ${planDef.name} allows ${planDef.questionsPerDay} question(s) per day.`,
      403,
      "DAILY_LIMIT_REACHED"
    );
  }

  return {
    allowed: true,
    plan: usage.plan,
    limit: usage.limit,
    usedToday: usage.usedToday,
    remaining: usage.remaining,
  };
}
