import React from "react";
import Card, { CardHeader } from "../common/Card";

const COLORS = { General:"var(--clr-text-3)",SC:"var(--clr-primary)",ST:"var(--clr-accent)",OBC:"#60A5FA",PWD:"#A78BFA",EWS:"#F472B6" };

const DiversityChart = ({ breakdown = [], total = 1 }) => (
  <Card>
    <CardHeader title="Diversity Breakdown" subtitle={`${total} candidates`} />
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
      {breakdown.map(({ _id, count }) => {
        const pct = ((count/total)*100).toFixed(1);
        return (
          <div key={_id}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:"0.85rem" }}>
              <span style={{ fontWeight:600 }}>{_id}</span>
              <span style={{ color:"var(--clr-text-2)" }}>{count} ({pct}%)</span>
            </div>
            <div style={{ height:8,background:"var(--clr-border)",borderRadius:4,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${pct}%`,background:COLORS[_id]||"var(--clr-text-3)",borderRadius:4,transition:"width 1s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

export default DiversityChart;
