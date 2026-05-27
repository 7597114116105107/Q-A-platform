import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setGeneratedPassword("");
    setLoading(true);

    try {
      const response = await api.forgotPassword(identifier);
      setMessage(response.message);
      setGeneratedPassword(response.generatedPassword);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.error ?? "Unable to process forgot password request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Forgot password</h1>
        <p>Enter your registered email or phone number.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        {generatedPassword && (
          <div className="alert alert-warning">
            New generated password: <strong>{generatedPassword}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="identifier">Registered email or phone</label>
            <input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Processing..." : "Generate new password"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: "0.9rem", color: "var(--muted)" }}>
          Back to <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
