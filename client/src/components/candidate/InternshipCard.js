import React from "react";
import { Link } from "react-router-dom";
import Badge from "../common/Badge";
import SkillTags from "../common/SkillTags";
import Button from "../common/Button";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { STATUS_BADGE_VARIANT } from "../../utils/constants";

const InternshipCard = ({ internship, score, onApply, applying, applied }) => {
  const { _id, title, company, location, duration, stipend, requiredSkills, status, isRemote, applicationDeadline } = internship;
  return (
    <div style={{ background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:"var(--radius-md)",padding:20,display:"flex",flexDirection:"column",gap:12,transition:"all var(--transition)" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:40,height:40,background:"var(--clr-primary-dim)",color:"var(--clr-primary)",borderRadius:"var(--radius-sm)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontFamily:"var(--font-display)",flexShrink:0 }}>
            {company?.companyName?.[0] || "?"}
          </div>
          <div>
            <Link to={`/candidate/internship/${_id}`} style={{ fontWeight:700,fontSize:"0.95rem",color:"var(--clr-text)",display:"block",marginBottom:2 }}>{title}</Link>
            <span style={{ fontSize:"0.8rem",color:"var(--clr-text-2)" }}>{company?.companyName}</span>
          </div>
        </div>
        {score !== undefined && (
          <div style={{ textAlign:"center",flexShrink:0 }}>
            <div style={{ fontFamily:"var(--font-display)",fontWeight:800,fontSize:"1.1rem",color:"var(--clr-primary)" }}>{Math.round(score)}%</div>
            <div style={{ fontSize:"0.68rem",color:"var(--clr-text-3)" }}>match</div>
          </div>
        )}
      </div>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",fontSize:"0.8rem",color:"var(--clr-text-2)" }}>
        <span>📍 {location}</span>
        <span>⏱ {duration}</span>
        {stipend > 0 ? <span>💰 {formatCurrency(stipend)}/mo</span> : <span>Unpaid</span>}
        {isRemote && <Badge variant="info" size="sm">Remote</Badge>}
        <Badge variant={STATUS_BADGE_VARIANT[status] || "default"} size="sm">{status}</Badge>
      </div>
      <SkillTags skills={requiredSkills || []} max={5} />
      {applicationDeadline && (
        <p style={{ fontSize:"0.75rem",color:"var(--clr-text-3)" }}>Deadline: {formatDate(applicationDeadline)}</p>
      )}
      <div style={{ display:"flex",gap:8,marginTop:4 }}>
        <Link to={`/candidate/internship/${_id}`} style={{ flex:1 }}>
          <Button variant="secondary" size="sm" fullWidth>View Details</Button>
        </Link>
        <Button variant={applied?"ghost":"primary"} size="sm" disabled={applied} loading={applying} onClick={() => onApply && onApply(_id)} fullWidth>
          {applied ? "✓ Applied" : "Apply"}
        </Button>
      </div>
    </div>
  );
};

export default InternshipCard;
