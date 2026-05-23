import { FormEvent, useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  api,
  ApiError,
  Question,
  SubscriptionInfo,
  UsageInfo,
} from "../api/client";

function planBadgeClass(plan: string) {
  return `badge badge-${plan.toLowerCase()}`;
}

function formatLimit(usage: UsageInfo | null) {
  if (!usage) return "—";
  if (usage.isUnlimited || usage.limit === null) return "Unlimited";
  return `${usage.remaining ?? 0} of ${usage.limit} left today`;
}

export default function DashboardPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    const [subRes, qRes] = await Promise.all([
      api.getSubscription(),
      api.getQuestions(),
    ]);
    setSubscription(subRes.subscription);
    setUsage(subRes.usage);
    setQuestions(qRes.questions);
  }

  useEffect(() => {
    loadData().catch((err: ApiError) => {
      if (err.status !== 401) {
        setError(err.error ?? "Could not load dashboard");
      }
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await api.postQuestion({ title, body });
      setTitle("");
      setBody("");
      setSuccess("Question posted successfully.");
      setUsage(res.usage);
      setQuestions((prev) => [res.question, ...prev]);
      await loadData();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.error ?? "Could not post question");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <h1 style={{ margin: "0 0 8px" }}>Dashboard</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 24px" }}>
        Post questions based on your active subscription plan.
      </p>

      <div className="stats-row">
        <div className="stat-box">
          <div className="label">Current plan</div>
          <div className="value" style={{ fontSize: "1.1rem" }}>
            {subscription && (
              <span className={planBadgeClass(subscription.plan)}>
                {subscription.planName}
              </span>
            )}
          </div>
        </div>
        <div className="stat-box">
          <div className="label">Daily quota</div>
          <div className="value" style={{ fontSize: "1rem" }}>
            {formatLimit(usage)}
          </div>
        </div>
        <div className="stat-box">
          <div className="label">Posted today</div>
          <div className="value">{usage?.usedToday ?? 0}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>Ask a question</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need help with?"
              required
              minLength={5}
            />
          </div>
          <div className="form-group">
            <label htmlFor="body">Details</label>
            <textarea
              id="body"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your question in detail…"
              required
              minLength={10}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Posting…" : "Post question"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>Your questions</h2>
        {questions.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>No questions yet.</p>
        ) : (
          <ul className="question-list">
            {questions.map((q) => (
              <li key={q.id} className="question-item">
                <h3>{q.title}</h3>
                <p style={{ margin: "0 0 8px", color: "var(--muted)" }}>{q.body}</p>
                <time dateTime={q.createdAt}>
                  {new Date(q.createdAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
