import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Button from "../common/Button";
import Alert from "../common/Alert";

const LoginForm = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display:"flex",flexDirection:"column",gap:14 }}>
      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      <input name="email" type="email" required value={form.email}
        onChange={(e) => setForm({...form, email: e.target.value})}
        placeholder="Email address"
        style={{ background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:"var(--radius-sm)",color:"var(--clr-text)",padding:"10px 14px",fontSize:"0.9rem",width:"100%",fontFamily:"var(--font-body)" }} />
      <input name="password" type="password" required value={form.password}
        onChange={(e) => setForm({...form, password: e.target.value})}
        placeholder="Password"
        style={{ background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:"var(--radius-sm)",color:"var(--clr-text)",padding:"10px 14px",fontSize:"0.9rem",width:"100%",fontFamily:"var(--font-body)" }} />
      <Button type="submit" fullWidth loading={loading} size="lg">Sign In</Button>
    </form>
  );
};

export default LoginForm;
