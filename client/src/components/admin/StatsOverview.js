import React from "react";

const StatsOverview = ({ stats = [] }) => (
  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14 }}>
    {stats.map(({ label, value, icon, color }) => (
      <div key={label} style={{ background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderTop:`3px solid ${color}`,borderRadius:"var(--radius-md)",padding:18 }}>
        <div style={{ fontSize:"1.2rem",marginBottom:6 }}>{icon}</div>
        <div style={{ fontFamily:"var(--font-display)",fontSize:"1.8rem",fontWeight:800,lineHeight:1 }}>{value ?? "—"}</div>
        <div style={{ fontSize:"0.75rem",color:"var(--clr-text-2)",marginTop:4,textTransform:"capitalize" }}>{label}</div>
      </div>
    ))}
  </div>
);

export default StatsOverview;
