import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import PaymentModal from "../components/PaymentModal";
import {
  api,
  ApiError,
  Plan,
  PaidPlanId,
  PaymentWindow,
  CreateOrderResponse,
} from "../api/client";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentWindow, setPaymentWindow] = useState<PaymentWindow | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<CreateOrderResponse | null>(null);

  useEffect(() => {
    api.getPlans().then((res) => {
      setPlans(res.plans);
      setPaymentWindow(res.paymentWindow);
    });

    const interval = setInterval(() => {
      api.getPaymentWindow().then(setPaymentWindow).catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function handleSubscribe(planId: PaidPlanId) {
    setError("");
    setSuccess("");

    try {
      const order = await api.createOrder(planId);
      setPendingOrder(order);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.error ?? "Could not start payment");
    }
  }

  async function handleConfirmPayment() {
    if (!pendingOrder) return;

    setLoading(true);
    setError("");

    try {
      const result = await api.confirmPayment(pendingOrder.orderId);
      setPendingOrder(null);
      setSuccess(
        `${result.message} Invoice: ${result.invoiceNumber}. Check your email if SMTP is configured.`
      );
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.error ?? "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <h1 style={{ margin: "0 0 8px" }}>Subscription plans</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 16px" }}>
        Upgrade to post more questions each day. All limits reset at midnight IST.
      </p>

      {paymentWindow && (
        <div
          className={`alert ${paymentWindow.isOpen ? "alert-success" : "alert-warning"}`}
        >
          <strong>Payment window ({paymentWindow.timezone}):</strong>{" "}
          {paymentWindow.window} — Currently {paymentWindow.currentTime}.{" "}
          {paymentWindow.message}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.id === "GOLD" ? "featured" : ""}`}
          >
            <span className={`badge badge-${plan.id.toLowerCase()}`}>
              {plan.name}
            </span>
            <div className="plan-price">
              {plan.priceInr === 0 ? (
                "Free"
              ) : (
                <>
                  ₹{plan.priceInr}
                  <span> / month</span>
                </>
              )}
            </div>
            <ul className="plan-features">
              <li>
                {plan.questionsPerDay === null
                  ? "Unlimited questions per day"
                  : `${plan.questionsPerDay} question${plan.questionsPerDay > 1 ? "s" : ""} per day`}
              </li>
              <li>{plan.description}</li>
            </ul>

            {plan.isPaid ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!paymentWindow?.isOpen || loading || !!pendingOrder}
                onClick={() => handleSubscribe(plan.id as PaidPlanId)}
              >
                {paymentWindow?.isOpen ? "Subscribe" : "Payments closed"}
              </button>
            ) : (
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                Included on registration
              </span>
            )}
          </div>
        ))}
      </div>

      <p style={{ marginTop: 24, color: "var(--muted)", fontSize: "0.9rem" }}>
        Payments are processed on this platform (no third-party gateway required).
        Return to the <Link to="/dashboard">dashboard</Link> to post questions.
      </p>

      {pendingOrder && (
        <PaymentModal
          order={pendingOrder}
          loading={loading}
          onConfirm={handleConfirmPayment}
          onCancel={() => !loading && setPendingOrder(null)}
        />
      )}
    </Layout>
  );
}
