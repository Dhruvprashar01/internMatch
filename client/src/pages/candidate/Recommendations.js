import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRecommendations, applyToInternship } from "../../services/candidateService";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import SkillTags from "../../components/common/SkillTags";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import "./Recommendations.css";

const ScoreRing = ({ score }) => {
  const color = score >= 75 ? "var(--clr-primary)" : score >= 50 ? "var(--clr-accent)" : "var(--clr-text-3)";
  return (
    <div className="score-ring" style={{ "--score-color": color }}>
      <svg viewBox="0 0 36 36" className="score-svg">
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--clr-border)" strokeWidth="2.5" />
        <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${score * 0.942} 100`} strokeLinecap="round"
          transform="rotate(-90 18 18)" />
      </svg>
      <span className="score-num" style={{ color }}>{Math.round(score)}</span>
    </div>
  );
};

const Recommendations = () => {
  const navigate = useNavigate();
  const [recs,     setRecs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [applying, setApplying] = useState(null);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  useEffect(() => {
    getRecommendations()
      .then(({ data }) => setRecs(data.data || []))
      .catch((e) => setError(e.response?.data?.message || "Could not load recommendations"))
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async (internshipId) => {
    setApplying(internshipId); setError(""); setSuccess("");
    try {
      await applyToInternship(internshipId, {});

      // ✅ Remove card immediately — no point showing "✓ Applied" since
      // backend already excludes applied internships from next fetch
      setRecs((prev) => prev.filter((r) => r.internship._id !== internshipId));
      setSuccess("Application submitted! ✓ This internship has been removed from your recommendations.");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to apply");
    } finally {
      setApplying(null);
    }
  };

  if (loading) return <Spinner label="Generating AI recommendations..." />;

  return (
    <div className="recs-page">
      <div className="recs-header">
        <div>
          <h1 className="recs-title">AI Recommendations <span className="text-primary">✦</span></h1>
          <p className="recs-subtitle">
            {recs.length > 0
              ? `Top ${recs.length} internships matched to your profile by Gemini AI`
              : "All caught up — no new recommendations"}
          </p>
        </div>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} duration={4000} />}

      {recs.length === 0 ? (
        <div className="recs-empty-state">
          <div className="recs-empty-icon">✦</div>
          <h3>No new recommendations</h3>
          <p>You've applied to all current matches, or add more skills to unlock new ones.</p>
          <div className="recs-empty-actions">
            <Link to="/candidate/profile"><Button variant="primary">Update Profile</Button></Link>
            <Link to="/candidate/applications"><Button variant="secondary">My Applications</Button></Link>
          </div>
        </div>
      ) : (
        <div className="recs-list">
          {recs.map((rec, idx) => (
            <div key={rec.internship._id} className="rec-card" style={{ animationDelay: `${idx * 0.06}s` }}>
              <div className="rec-rank">#{idx + 1}</div>

              <div className="rec-body">
                <div className="rec-top">
                  <div className="rec-info">
                    <div className="rec-company-row">
                      <div className="rec-company-avatar">
                        {rec.internship.company?.companyName?.[0] || "?"}
                      </div>
                      <div>
                        <h3 className="rec-title">{rec.internship.title}</h3>
                        <span className="rec-company">{rec.internship.company?.companyName}</span>
                      </div>
                    </div>
                    <div className="rec-meta">
                      <span>📍 {rec.internship.location}</span>
                      <span>⏱ {rec.internship.duration}</span>
                      {rec.internship.stipend > 0 && <span>💰 ₹{rec.internship.stipend.toLocaleString()}/mo</span>}
                      {rec.internship.isRemote && <Badge variant="info">Remote</Badge>}
                    </div>
                  </div>
                  <ScoreRing score={rec.score} />
                </div>

                {/* Score breakdown bars */}
                <div className="rec-breakdown">
                  {Object.entries(rec.breakdown || {}).map(([dim, val]) => (
                    <div key={dim} className="rec-bar-row">
                      <span className="rec-bar-label">{dim}</span>
                      <div className="rec-bar-track">
                        <div className="rec-bar-fill" style={{ width: `${val}%`, backgroundColor: val >= 60 ? "var(--clr-primary)" : val >= 40 ? "var(--clr-accent)" : "var(--clr-text-3)" }} />
                      </div>
                      <span className="rec-bar-val">{Math.round(val)}%</span>
                    </div>
                  ))}
                </div>

                {/* Required skills */}
                <div className="rec-skills-row">
                  <span className="rec-skills-label">Required:</span>
                  <SkillTags skills={rec.internship.requiredSkills || []} max={6} variant={rec.matchedSkills?.length > 0 ? "primary" : "default"} />
                </div>

                {/* AI Explanation */}
                {rec.explanation && (
                  <div className="rec-explanation">
                    <span className="rec-exp-badge">✦ Gemini AI</span>
                    <p>{rec.explanation}</p>
                  </div>
                )}

                {rec.fairnessApplied && (
                  <div className="rec-fairness-badge">◈ Diversity-inclusive ranking applied</div>
                )}

                <div className="rec-actions">
                  <Link to={`/candidate/internship/${rec.internship._id}`}>
                    <Button variant="secondary" size="sm">View Details</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/candidate/roadmap/${rec.internship._id}`, { state: { title: rec.internship.title } })}
                  >
                    🗺 Get Roadmap
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={applying === rec.internship._id}
                    onClick={() => handleApply(rec.internship._id)}
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;