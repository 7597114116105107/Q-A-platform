import { PlanType } from "@prisma/client";

export type PlanDefinition = {
  id: PlanType;
  name: string;
  priceInr: number;
  pricePaise: number;
  questionsPerDay: number | null;
  description: string;
};

export const PLANS: Record<PlanType, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Free Plan",
    priceInr: 0,
    pricePaise: 0,
    questionsPerDay: 1,
    description: "Post 1 question per day",
  },
  BRONZE: {
    id: "BRONZE",
    name: "Bronze Plan",
    priceInr: 100,
    pricePaise: 10000,
    questionsPerDay: 5,
    description: "Post up to 5 questions per day",
  },
  SILVER: {
    id: "SILVER",
    name: "Silver Plan",
    priceInr: 300,
    pricePaise: 30000,
    questionsPerDay: 10,
    description: "Post up to 10 questions per day",
  },
  GOLD: {
    id: "GOLD",
    name: "Gold Plan",
    priceInr: 1000,
    pricePaise: 100000,
    questionsPerDay: null,
    description: "Unlimited question posting",
  },
};

export const PAID_PLANS: PlanType[] = ["BRONZE", "SILVER", "GOLD"];

export function getPlan(plan: PlanType): PlanDefinition {
  return PLANS[plan];
}

export function isPaidPlan(plan: PlanType): boolean {
  return PAID_PLANS.includes(plan);
}
