import React from "react";
import Badge from "../common/Badge";
import Button from "../common/Button";
import { formatDate, formatCurrency, formatRelative } from "../../utils/formatters";
import { STATUS_BADGE_VARIANT } from "../../utils/constants";

const ApplicationCard = ({ application, onWithdraw }) => {
  const { _id, internship, status, matchScore, aiExplanation, createdAt } = application;
  return (
    <div style={{ background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:"var(--radius-md)",padding:18,transition:"all var(--transition)" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12 }}>
        <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
          <div style={{ width:40,height:40,background:"var(--clr-surface-2)",border:"1px solid var(--clr-border)",borderRadius:"var(--radius-sm)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"var(--clr-primary)",flexShrink:0 }}>
            {internship?.company?.companyName?.[0] || "?"}
          </div>
          <div>
            <h4 style={{ fontWeight:700,fontSize:"0.92rem",marginBottom:2 }}>{internship?.title}</h4>
            <p style={{ fontSize:"0.8rem",color:"var(--clr-text-2)" }}>{internship?.company?.companyName} · {internship?.location}</p>
            <p style={{ fontSize:"0.75rem",color:"var(--clr-text-3)",marginTop:2 }}>Applied {formatRelative(createdAt)}</p>
          </div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0 }}>
          <Badge variant={STATUS_BADGE_VARIANT[status] || "default"}>{status}</Badge>
          <span style={{ fontSize:"0.78rem",fontWeight:700,color:"var(--clr-primary)" }}>{matchScore}% match</span>
          {["pending","reviewed"].includes(status) && (
            <Button variant="ghost" size="sm" onClick={() => onWithdraw(_id)}>Withdraw</Button>
          )}
        </div>
      </div>
      {aiExplanation && (
        <div style={{ marginTop:12,padding:"8px 12px",background:"var(--clr-surface-2)",borderLeft:"3px solid var(--clr-primary)",borderRadius:"var(--radius-sm)" }}>
          <p style={{ fontSize:"0.82rem",color:"var(--clr-text-2)" }}>{aiExplanation}</p>
        </div>
      )}
    </div>
  );
};

export default ApplicationCard;
