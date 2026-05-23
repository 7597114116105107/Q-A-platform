import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <nav className="nav">
        <Link to="/dashboard" className="nav-brand">
          QA Platform
        </Link>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/plans">Plans</Link>
          <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            {user?.name}
          </span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
