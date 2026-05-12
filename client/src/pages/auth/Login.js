import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";
import "./Auth.css";

const GOOGLE_AUTH_URL = `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/google`;

const Login = () => {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const [form,       setForm]      = useState({ email: "", password: "" });
  const [loading,    setLoading]   = useState(false);
  const [toast,      setToast]     = useState({ show: false, msg: "" });
  const timerRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ show: true, msg });
    timerRef.current = setTimeout(() => setToast({ show: false, msg: "" }), 6000);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Show error if redirected from Google with error
  useEffect(() => {
    if (params.get("error") === "google_failed") {
      showToast("Google sign-in failed. Please try again or use email & password.");
    }
  }, [params, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}`);
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">

      {/* Toast */}
      <div className={`lp-toast ${toast.show ? "lp-toast-show" : ""}`}>
        <span className="lp-toast-icon">⚠</span>
        <span className="lp-toast-msg">{toast.msg}</span>
        <button className="lp-toast-x" onClick={() => setToast({ show: false, msg: "" })}>✕</button>
        {toast.show && <div className="lp-toast-bar" key={toast.msg} />}
      </div>

      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo-mark">IM</div>
          <h1 className="auth-brand-title">InternMatch AI</h1>
          <p className="auth-brand-sub">Intelligent internship matching powered by Gemini AI</p>
          <div className="auth-brand-stats">
            <div className="auth-stat"><span className="auth-stat-num">10K+</span><span>Internships</span></div>
            <div className="auth-stat"><span className="auth-stat-num">50K+</span><span>Candidates</span></div>
            <div className="auth-stat"><span className="auth-stat-num">95%</span><span>Match Rate</span></div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          {/* ── Google Sign-In Button ── */}
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
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <input
                name="email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required className="auth-input" placeholder="you@example.com"
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                name="password" type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required className="auth-input" placeholder="Enter your password"
              />
            </div>
            <Button type="submit" fullWidth loading={loading} size="lg">Sign In</Button>
          </form>

          <p className="auth-footer-text">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">Create one free</Link>
          </p>

          <div className="auth-demo-accounts">
            <p className="auth-demo-label">Demo accounts</p>
            <div className="auth-demo-chips">
              <button className="auth-demo-chip" onClick={() => setForm({ email: "candidate@demo.com",    password: "Demo1234"   })}>Candidate</button>
              <button className="auth-demo-chip" onClick={() => setForm({ email: "company@demo.com",      password: "Demo1234"   })}>Company</button>
              <button className="auth-demo-chip" onClick={() => setForm({ email: "admin@internmatch.com", password: "Admin@1234" })}>Admin</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;