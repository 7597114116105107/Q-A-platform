const API_BASE = "/api";

export type ApiError = { error: string; code?: string; status?: number };

let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(handler: () => void) {
  onSessionExpired = handler;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && onSessionExpired) {
      onSessionExpired();
    }
    throw { status: res.status, ...(data as ApiError) };
  }

  return data as T;
}

export const api = {
  register: (body: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  forgotPassword: (identifier: string) =>
    request<{ message: string; generatedPassword: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ identifier }),
      }
    ),

  getPlans: () =>
    request<{ plans: Plan[]; paymentWindow: PaymentWindow }>("/plans"),

  getSubscription: () =>
    request<{ subscription: SubscriptionInfo; usage: UsageInfo }>(
      "/subscription/me"
    ),

  getPaymentWindow: () =>
    request<PaymentWindow>("/payments/window"),

  createOrder: (plan: PaidPlanId) =>
    request<CreateOrderResponse>("/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ plan }),
    }),

  confirmPayment: (orderId: string) =>
    request<ConfirmPaymentResponse>("/payments/confirm", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    }),

  getQuestions: () =>
    request<{ questions: Question[] }>("/questions"),

  postQuestion: (body: { title: string; body: string }) =>
    request<{ question: Question; usage: UsageInfo }>("/questions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export type User = { id: string; name: string; email: string };

export type Plan = {
  id: string;
  name: string;
  priceInr: number;
  questionsPerDay: number | null;
  description: string;
  isPaid: boolean;
};

export type PaidPlanId = "BRONZE" | "SILVER" | "GOLD";

export type PaymentWindow = {
  timezone: string;
  currentTime: string;
  window: string;
  isOpen: boolean;
  message: string;
};

export type SubscriptionInfo = {
  plan: string;
  planName: string;
  questionsPerDay: number | null;
  description: string;
  expiresAt: string | null;
  isUnlimited: boolean;
};

export type UsageInfo = {
  usedToday: number;
  limit: number | null;
  remaining: number | null;
  isUnlimited?: boolean;
};

export type Question = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export type CreateOrderResponse = {
  orderId: string;
  amount: number;
  amountInr: number;
  currency: string;
  invoiceNumber: string;
  plan: {
    id: string;
    name: string;
    priceInr: number;
    description: string;
  };
};

export type ConfirmPaymentResponse = {
  success: boolean;
  message: string;
  invoiceNumber: string;
  subscription: SubscriptionInfo;
};
