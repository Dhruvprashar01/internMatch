import React, { useState } from "react";
import "./AtsScoreCard.css";

// Gauge ring component
const ScoreGauge = ({ score, size = 100 }) => {
  const grade  = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Weak";
  const color  = score >= 80 ? "#10B981" : score >= 60 ? "#00D4C8" : score >= 40 ? "#F59E0B" : "#EF4444";
  const r      = 40;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="ats-gauge" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" style={{ width: size, height: size, transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--clr-border)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="ats-gauge-inner">
        <span className="ats-gauge-score" style={{ color }}>{score}</span>
        <span className="ats-gauge-label" style={{ color }}>{grade}</span>
      </div>
    </div>
  );
};

// Single category bar
const CategoryBar = ({ label, score, weight, detail, matched, missing, found }) => {
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#00D4C8" : score >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div className="ats-cat">
      <div className="ats-cat-header">
        <span className="ats-cat-label">{label}</span>
        <span className="ats-cat-weight">{weight}</span>
        <span className="ats-cat-score" style={{ color }}>{score}%</span>
      </div>
      <div className="ats-cat-track">
        <div className="ats-cat-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      {detail && <p className="ats-cat-detail">{detail}</p>}
      {matched?.length > 0 && (
        <div className="ats-chips">
          {matched.map((s) => <span key={s} className="ats-chip ats-chip-ok">✓ {s}</span>)}
        </div>
      )}
      {missing?.length > 0 && (
        <div className="ats-chips">
          {missing.slice(0, 5).map((s) => <span key={s} className="ats-chip ats-chip-miss">✕ {s}</span>)}
        </div>
      )}
      {found?.length > 0 && (
        <p className="ats-cat-detail">Keywords found: {found.slice(0, 6).join(", ")}</p>
      )}
    </div>
  );
};

/**
 * AtsScoreCard — full ATS breakdown widget
 * Props:
 *   atsScore: { overall, grade, breakdown: { skills, keywords, education, experience }, aiAnalysis }
 *   title: optional string (e.g. "ATS Score for Full Stack Intern")
 *   compact: boolean — show only gauge + overall, no full breakdown
 */
const AtsScoreCard = ({ atsScore, title, compact = false }) => {
  const [expanded, setExpanded] = useState(!compact);

  if (!atsScore || atsScore.overall === null || atsScore.overall === undefined) {
    return (
      <div className="ats-card ats-card-empty">
        <span className="ats-empty-icon">📄</span>
        <p>Upload your resume to get your ATS score</p>
      </div>
    );
  }

  const { overall, breakdown, aiAnalysis } = atsScore;

  return (
    <div className="ats-card">
      {/* Header */}
      <div className="ats-header">
        <div className="ats-header-left">
          <ScoreGauge score={overall} size={compact ? 72 : 90} />
          <div>
            <h3 className="ats-title">{title || "ATS Score"}</h3>
            <p className="ats-subtitle">Resume compatibility score</p>
          </div>
        </div>
        {compact && (
          <button className="ats-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Hide details" : "View breakdown"} {expanded ? "▲" : "▼"}
          </button>
        )}
      </div>

      {expanded && (
        <>
          {/* Category bars */}
          {breakdown && (
            <div className="ats-categories">
              <CategoryBar label="Skills Match"  weight="40%" score={breakdown.skills?.score  ?? 0} matched={breakdown.skills?.matched}   missing={breakdown.skills?.missing} />
              <CategoryBar label="Keywords"      weight="25%" score={breakdown.keywords?.score ?? 0} found={breakdown.keywords?.found}     detail={breakdown.keywords?.total ? `${breakdown.keywords.found?.length || 0}/${breakdown.keywords.total} keywords matched` : undefined} />
              <CategoryBar label="Education"     weight="20%" score={breakdown.education?.score ?? 0} detail={breakdown.education?.detail} />
              <CategoryBar label="Experience"    weight="15%" score={breakdown.experience?.score ?? 0} detail={breakdown.experience?.detail} />
            </div>
          )}

          {/* AI Analysis */}
          {aiAnalysis && (
            <div className="ats-ai">
              <div className="ats-ai-badge">✦ Gemini AI Analysis</div>
              {aiAnalysis.summary && <p className="ats-ai-summary">{aiAnalysis.summary}</p>}

              {aiAnalysis.strengths?.length > 0 && (
                <div className="ats-ai-section">
                  <p className="ats-ai-section-title">✓ Strengths</p>
                  {aiAnalysis.strengths.map((s, i) => (
                    <p key={i} className="ats-ai-point ats-ai-point-ok">• {s}</p>
                  ))}
                </div>
              )}

              {aiAnalysis.improvements?.length > 0 && (
                <div className="ats-ai-section">
                  <p className="ats-ai-section-title">↑ To Improve</p>
                  {aiAnalysis.improvements.map((s, i) => (
                    <p key={i} className="ats-ai-point ats-ai-point-imp">• {s}</p>
                  ))}
                </div>
              )}

              {aiAnalysis.keywordTip && (
                <div className="ats-ai-tip">
                  <span>💡</span> {aiAnalysis.keywordTip}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AtsScoreCard;