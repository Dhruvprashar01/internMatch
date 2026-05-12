import React from "react";
import Card, { CardHeader } from "../common/Card";

const AnalyticsCard = ({ title, subtitle, data = [], totalKey }) => {
  const total = data.reduce((s, d) => s + (d.count || 0), 0) || 1;
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {data.map(({ _id, count }) => (
          <div key={_id} style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ width:100,fontSize:"0.82rem",textTransform:"capitalize",color:"var(--clr-text-2)",flexShrink:0 }}>{_id}</span>
            <div style={{ flex:1,height:6,background:"var(--clr-border)",borderRadius:3,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${(count/total)*100}%`,background:"var(--clr-primary)",borderRadius:3,transition:"width 0.8s ease" }} />
            </div>
            <span style={{ width:28,textAlign:"right",fontSize:"0.8rem",color:"var(--clr-text-2)" }}>{count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AnalyticsCard;
