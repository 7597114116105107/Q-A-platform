import { CreateOrderResponse } from "../api/client";

type Props = {
  order: CreateOrderResponse;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function PaymentModal({
  order,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ maxWidth: 420, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: "1.25rem" }}>Confirm payment</h2>
        <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>
          Review your order before completing the subscription.
        </p>

        <table style={{ width: "100%", marginBottom: 24, fontSize: "0.95rem" }}>
          <tbody>
            <tr>
              <td style={{ color: "var(--muted)", padding: "6px 0" }}>Plan</td>
              <td style={{ textAlign: "right" }}>{order.plan.name}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--muted)", padding: "6px 0" }}>Amount</td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>
                ₹{order.amountInr}
              </td>
            </tr>
            <tr>
              <td style={{ color: "var(--muted)", padding: "6px 0" }}>Invoice</td>
              <td style={{ textAlign: "right", fontSize: "0.85rem" }}>
                {order.invoiceNumber}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing…" : `Pay ₹${order.amountInr}`}
          </button>
        </div>
      </div>
    </div>
  );
}
