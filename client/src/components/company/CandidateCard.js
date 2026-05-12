import React from "react";
import SkillTags from "../common/SkillTags";
import Badge from "../common/Badge";
import Button from "../common/Button";
import { STATUS_BADGE_VARIANT } from "../../utils/constants";

const CandidateCard = ({ application, rank, onStatusChange }) => {
  const { _id, candidate, matchScore, status, aiExplanation } = application;
  return (
    <div style={{ background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:"var(--radius-md)",padding:18,display:"flex",gap:14,transition:"all var(--transition)" }}>
      <div style={{ width:40,height:40,background:"var(--clr-primary-dim)",border:"1px solid var(--clr-primary)",borderRadius:"var(--radius-sm)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontWeight:800,color:"var(--clr-primary)",flexShrink:0 }}>
        {rank ? `#${rank}` : candidate?.user?.name?.[0]?.toUpperCase()}
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
          <div>
            <h4 style={{ fontWeight:700,fontSize:"0.92rem" }}>{candidate?.user?.name}</h4>
            <p style={{ fontSize:"0.78rem",color:"var(--clr-text-2)" }}>{candidate?.user?.email} · {candidate?.currentLocation}</p>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"var(--font-display)",fontWeight:800,color:"var(--clr-primary)" }}>{matchScore}%</div>
              <div style={{ fontSize:"0.68rem",color:"var(--clr-text-3)" }}>match</div>
            </div>
            <Badge variant={STATUS_BADGE_VARIANT[status]||"default"}>{status}</Badge>
          </div>
        </div>
        <SkillTags skills={candidate?.skills||[]} max={6} />
        {aiExplanation && <p style={{ fontSize:"0.8rem",color:"var(--clr-text-2)",marginTop:8,fontStyle:"italic" }}>{aiExplanation}</p>}
        <div style={{ display:"flex",gap:6,marginTop:10,flexWrap:"wrap" }}>
          {["shortlisted","accepted","rejected"].map((s) => (
            <Button key={s} variant={status===s?"primary":"secondary"} size="sm" onClick={() => onStatusChange(_id, s)}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;
