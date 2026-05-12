import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Button from "../common/Button";
import Alert from "../common/Alert";

const RegisterForm = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"candidate" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setF = (k, v) => setForm((f) => ({...f, [k]: v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const user = await register(form);
      navigate(`/${user.role}`);
    } catch (err) { setError(err.response?.data?.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  const inputStyle = { background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:"var(--radius-sm)",color:"var(--clr-text)",padding:"10px 14px",fontSize:"0.9rem",width:"100%",fontFamily:"var(--font-body)" };

  return (
    <form onSubmit={handleSubmit} style={{ display:"flex",flexDirection:"column",gap:14 }}>
      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
        {["candidate","company"].map((r) => (
          <button key={r} type="button" onClick={() => setF("role",r)}
            style={{ padding:"12px",borderRadius:"var(--radius-sm)",border:"1px solid",cursor:"pointer",fontFamily:"var(--font-body)",fontWeight:600,fontSize:"0.85rem",borderColor: form.role===r?"var(--clr-primary)":"var(--clr-border)",background:form.role===r?"var(--clr-primary-dim)":"var(--clr-surface)",color:form.role===r?"var(--clr-primary)":"var(--clr-text-2)" }}>
            {r==="candidate"?"👤 Candidate":"🏢 Company"}
          </button>
        ))}
      </div>
      <input name="name" required value={form.name} onChange={(e) => setF("name",e.target.value)} placeholder={form.role==="company"?"Company Name":"Full Name"} style={inputStyle} />
      <input name="email" type="email" required value={form.email} onChange={(e) => setF("email",e.target.value)} placeholder="Email address" style={inputStyle} />
      <input name="password" type="password" required minLength={8} value={form.password} onChange={(e) => setF("password",e.target.value)} placeholder="Password (min 8 chars)" style={inputStyle} />
      <Button type="submit" fullWidth loading={loading} size="lg">Create Account</Button>
    </form>
  );
};

export default RegisterForm;
