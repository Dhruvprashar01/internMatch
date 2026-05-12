import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import "./Auth.css";

const GOOGLE_AUTH_URL = `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/google`;

const getStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (pwd.length >= 12)          score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;
  if (score <= 1) return { score: 1, label: "Weak",        color: "#EF4444" };
  if (score <= 2) return { score: 2, label: "Fair",        color: "#F59E0B" };
  if (score <= 3) return { score: 3, label: "Good",        color: "#3B82F6" };
  if (score <= 4) return { score: 4, label: "Strong",      color: "#10B981" };
  return              { score: 5, label: "Very Strong",  color: "#00D4C8" };
};

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const { score, label, color } = getStrength(password);
  return (
    <div className="pwd-strength">
      <div className="pwd-bars">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="pwd-bar" style={{ background: i < score ? color : "var(--clr-border)" }} />
        ))}
      </div>
      <span className="pwd-label" style={{ color }}>{label}</span>
    </div>
  );
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: "", email: "", password: "", role: "candidate" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      const user = await register(form);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo-mark">IM</div>
          <h1 className="auth-brand-title">Join InternMatch AI</h1>
          <p className="auth-brand-sub">Connect talent with opportunity using the power of AI</p>
          <ul className="auth-feature-list">
            <li>✦ AI-powered resume parsing</li>
            <li>✦ Smart skill-based matching</li>
            <li>✦ Fairness-aware recommendations</li>
            <li>✦ Gemini AI match explanations</li>
          </ul>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-subtitle">Get started for free in 30 seconds</p>

          {error && <Alert type="error" message={error} onClose={() => setError("")} />}

          {/* ── Google Sign-Up Button ── */}
          <a href={GOOGLE_AUTH_URL} className="google-btn">
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div className="auth-divider">
            <span>or register with email</span>
          </div>

          <div className="auth-role-selector">
            {["candidate", "company"].map((r) => (
              <button key={r} type="button"
                className={`auth-role-btn ${form.role === r ? "active" : ""}`}
                onClick={() => setForm({ ...form, role: r })}>
                <span className="auth-role-icon">{r === "candidate" ? "◎" : "⬡"}</span>
                <span className="auth-role-label">{r === "candidate" ? "I'm a Candidate" : "I'm a Company"}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">{form.role === "company" ? "Company Name" : "Full Name"}</label>
              <input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="auth-input" placeholder={form.role === "company" ? "Acme Corp" : "Priya Sharma"} />
            </div>
            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <input name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="auth-input" placeholder="you@example.com" />
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} className="auth-input" placeholder="Min. 8 characters" />
              <PasswordStrength password={form.password} />
            </div>
            <Button type="submit" fullWidth loading={loading} size="lg">Create Account</Button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;