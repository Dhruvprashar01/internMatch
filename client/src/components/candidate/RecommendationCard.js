import React from "react";
import InternshipCard from "./InternshipCard";

const RecommendationCard = ({ recommendation, onApply, applying, applied }) => {
  const { internship, score, breakdown, matchedSkills, missingSkills, explanation, strengthLevel, fairnessApplied } = recommendation;
  return (
    <div>
      <InternshipCard internship={internship} score={score} onApply={onApply} applying={applying} applied={applied} />
      {explanation && (
        <div style={{ marginTop:8,padding:"10px 14px",background:"var(--clr-surface-2)",borderLeft:"3px solid var(--clr-primary)",borderRadius:"var(--radius-sm)" }}>
          <div style={{ fontSize:"0.7rem",fontWeight:700,color:"var(--clr-primary)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4 }}>✦ Gemini AI · {strengthLevel}</div>
          <p style={{ fontSize:"0.85rem",color:"var(--clr-text-2)",lineHeight:1.5 }}>{explanation}</p>
          {fairnessApplied && <span style={{ fontSize:"0.72rem",color:"var(--clr-accent)",background:"var(--clr-accent-dim)",borderRadius:999,padding:"2px 8px",display:"inline-block",marginTop:6 }}>◈ Diversity boost applied</span>}
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
