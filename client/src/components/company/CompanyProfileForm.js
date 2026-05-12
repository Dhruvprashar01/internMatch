import React from "react";
import Button from "../common/Button";

const CompanyProfileForm = ({ form, onChange, onSubmit, loading }) => {
  const input = { background:"var(--clr-surface-2)",border:"1px solid var(--clr-border)",borderRadius:"var(--radius-sm)",color:"var(--clr-text)",padding:"9px 12px",fontSize:"0.9rem",width:"100%",fontFamily:"var(--font-body)" };
  const fields = [
    ["companyName","Company Name","Acme Corp"],["industry","Industry","Technology"],
    ["headquarters","Headquarters","Mumbai, India"],["website","Website","https://..."],
    ["size","Company Size","51-200"],["contactEmail","Contact Email","hr@..."],
  ];
  return (
    <form onSubmit={onSubmit} style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        {fields.map(([key, label, ph]) => (
          <div key={key} style={{ display:"flex",flexDirection:"column",gap:5 }}>
            <label style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)" }}>{label}</label>
            <input name={key} value={form[key]||""} onChange={onChange} placeholder={ph} style={input} />
          </div>
        ))}
        <div style={{ gridColumn:"1/-1",display:"flex",flexDirection:"column",gap:5 }}>
          <label style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)" }}>About</label>
          <textarea name="description" rows={4} value={form.description||""} onChange={onChange} placeholder="Company mission and culture…" style={{...input,resize:"vertical"}} />
        </div>
      </div>
      <Button type="submit" variant="primary" loading={loading}>Save Changes</Button>
    </form>
  );
};

export default CompanyProfileForm;
