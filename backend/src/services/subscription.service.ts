import { PlanType, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { getPlan } from "../config/plans.js";
import { addOneMonth } from "../utils/dates.js";

export async function getActiveSubscription(userId: string) {
  const now = new Date();
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
      expiresAt: { gt: now },
    },
    orderBy: { expiresAt: "desc" },
  });
}

export async function ensureFreeSubscription(userId: string) {
  const existing = await getActiveSubscription(userId);
  if (existing) return existing;

  const expiresAt = addOneMonth();
  return prisma.subscription.create({
    data: {
      userId,
      plan: PlanType.FREE,
      status: SubscriptionStatus.ACTIVE,
      expiresAt,
    },
  });
}

export async function activatePaidSubscription(
  userId: string,
  plan: PlanType
) {
  const now = new Date();
  const expiresAt = addOneMonth(now);

  await prisma.subscription.updateMany({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
    },
    data: { status: SubscriptionStatus.EXPIRED },
  });

  return prisma.subscription.create({
    data: {
      userId,
      plan,
      status: SubscriptionStatus.ACTIVE,
      startsAt: now,
      expiresAt,
    },
  });
}

export async function getSubscriptionSummary(userId: string) {
  const subscription = await getActiveSubscription(userId);
  const plan = subscription?.plan ?? PlanType.FREE;
  const planDef = getPlan(plan);

  return {
    plan: planDef.id,
    planName: planDef.name,
    questionsPerDay: planDef.questionsPerDay,
    description: planDef.description,
    status: subscription?.status ?? "ACTIVE",
    expiresAt: subscription?.expiresAt ?? null,
    isUnlimited: planDef.questionsPerDay === null,
  };
}
