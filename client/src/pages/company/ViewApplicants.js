import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getApplicants, updateApplicationStatus, markInternshipComplete } from "../../services/companyService";
import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import SkillTags from "../../components/common/SkillTags";
import Spinner from "../../components/common/Spinner";
import AtsScoreCard from "../../components/common/AtsScoreCard";
import "./ViewApplicants.css";

const STATUS_VAR = {
  pending:"default", reviewed:"info", shortlisted:"warning",
  accepted:"success", rejected:"danger", withdrawn:"default", completed:"success",
};

// Which statuses allow further changes
// Once accepted/rejected/completed/withdrawn → LOCKED, no going back
const LOCKED_STATUSES = ["accepted","rejected","completed","withdrawn"];

// Actions available per current status
const ALLOWED_ACTIONS = {
  pending:     ["reviewed","shortlisted","rejected"],
  reviewed:    ["shortlisted","rejected"],
  shortlisted: ["accepted","rejected"],
};

const AtsBadge = ({ score }) => {
  if (score === null || score === undefined) return null;
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#00D4C8" : score >= 40 ? "#F59E0B" : "#EF4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Weak";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:999, background:color+"20", border:`1px solid ${color}40`, whiteSpace:"nowrap" }}>
      <span style={{ fontFamily:"var(--font-display)", fontWeight:800, color, fontSize:"0.85rem" }}>{score}</span>
      <span style={{ fontSize:"0.7rem", color, fontWeight:600, textTransform:"uppercase" }}>ATS · {label}</span>
    </div>
  );
};

const ViewApplicants = () => {
  const { internshipId } = useParams();
  const [applicants,  setApplicants]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const [expandedId,  setExpandedId]  = useState(null);
  const [completing,  setCompleting]  = useState(null);
  const [confirmId,   setConfirmId]   = useState(null);

  useEffect(() => {
    getApplicants(internshipId)
      .then(({ data }) => setApplicants(data.data || []))
      .catch((e) => setError(e.response?.data?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [internshipId]);

  const handleStatusChange = async (appId, status) => {
    try {
      await updateApplicationStatus(appId, { status });
      setApplicants((prev) => prev.map((a) =>
        a._id === appId ? { ...a, status } : a
      ));
      setSuccess(`Application marked as ${status}`);
    } catch (e) { setError(e.response?.data?.message || "Update failed"); }
  };

  const handleMarkComplete = async (appId) => {
    setCompleting(appId); setConfirmId(null);
    try {
      const { data } = await markInternshipComplete(appId);
      setApplicants((prev) => prev.map((a) =>
        a._id === appId
          ? { ...a, status: "completed", certificate: { certificateId: data.data.certificateId } }
          : a
      ));
      setSuccess(`🏆 Internship complete! Certificate ID: ${data.data.certificateId}`);
    } catch (e) { setError(e.response?.data?.message || "Failed"); }
    finally { setCompleting(null); }
  };

  if (loading) return <Spinner label="Loading applicants..." />;

  return (
    <div className="va-page">

      {/* Confirm Complete Modal */}
      {confirmId && (
        <div className="va-overlay">
          <div className="va-confirm">
            <div style={{ fontSize:"2.5rem", marginBottom:8 }}>🏆</div>
            <h3>Mark Internship Complete?</h3>
            <p>This will issue an official certificate to the candidate. This cannot be undone.</p>
            <div className="va-confirm-actions">
              <Button variant="ghost"   onClick={() => setConfirmId(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => handleMarkComplete(confirmId)} loading={completing === confirmId}>
                Yes, Issue Certificate
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="va-header">
        <Link to="/company/internships" className="va-back">← Back to Internships</Link>
        <h1 className="va-title">Applicants</h1>
        <span className="va-count">{applicants.length} total</span>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} duration={8000} />}

      {applicants.length === 0 ? (
        <div className="va-empty">No applicants yet.</div>
      ) : (
        <div className="va-list">
          {applicants.map((app, idx) => {
            const cand      = app.candidate;
            const user      = cand?.user;
            const ats       = app.atsScore;
            const isExpanded= expandedId === app._id;
            const isLocked  = LOCKED_STATUSES.includes(app.status);
            const actions   = ALLOWED_ACTIONS[app.status] || [];

            return (
              <div key={app._id} className={`va-card ${isLocked ? "va-card-locked" : ""}`}>
                <div className="va-card-top">
                  <div className="va-rank">#{idx + 1}</div>
                  <div className="va-info">
                    <div className="va-name-row">
                      <span className="va-name">{user?.name || "Candidate"}</span>
                      <Badge variant={STATUS_VAR[app.status] || "default"}>{app.status}</Badge>
                      {app.status === "completed" && (
                        <span className="va-cert-badge">🏆 Certificate Issued</span>
                      )}
                      {isLocked && app.status !== "completed" && (
                        <span className="va-locked-note">🔒 Final decision</span>
                      )}
                    </div>
                    <span className="va-email">{user?.email}</span>
                  </div>
                  <div className="va-scores">
                    <div className="va-match-score">
                      <span className="va-match-num">{app.matchScore}%</span>
                      <span className="va-match-label">Match</span>
                    </div>
                    <AtsBadge score={ats?.overall} />
                  </div>
                </div>

                {cand?.skills?.length > 0 && (
                  <div className="va-skills">
                    <span className="va-skills-label">Skills:</span>
                    <SkillTags skills={cand.skills} max={8} variant="primary" />
                  </div>
                )}

                {app.aiExplanation && (
                  <div className="va-ai-exp">
                    <span className="va-ai-badge">✦ AI</span>
                    <p>{app.aiExplanation}</p>
                  </div>
                )}

                {ats?.overall !== null && ats?.overall !== undefined && (
                  <button className="va-ats-toggle" onClick={() => setExpandedId(isExpanded ? null : app._id)}>
                    {isExpanded ? "▲ Hide ATS Breakdown" : `▼ View ATS Breakdown (${ats.overall}/100)`}
                  </button>
                )}
                {isExpanded && <AtsScoreCard atsScore={ats} title={`ATS — ${user?.name}`} compact={false} />}

                {/* Actions section */}
                <div className="va-actions">
                  {/* Pending/Reviewed/Shortlisted — show allowed next steps only */}
                  {!isLocked && actions.map((s) => (
                    <Button
                      key={s}
                      variant={s === "accepted" ? "primary" : s === "rejected" ? "danger" : "secondary"}
                      size="sm"
                      onClick={() => handleStatusChange(app._id, s)}
                    >
                      {s === "accepted" ? "✓ Accept" : s === "rejected" ? "✕ Reject" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </Button>
                  ))}

                  {/* Accepted — only Mark Complete available */}
                  {app.status === "accepted" && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setConfirmId(app._id)}
                      loading={completing === app._id}
                    >
                      🏆 Mark Complete & Issue Certificate
                    </Button>
                  )}

                  {/* Completed — show certificate ID */}
                  {app.status === "completed" && app.certificate?.certificateId && (
                    <div className="va-cert-id">
                      📜 Certificate: <strong>{app.certificate.certificateId}</strong>
                    </div>
                  )}

                  {/* Rejected — show reason it's locked */}
                  {app.status === "rejected" && (
                    <span className="va-locked-msg">This application has been rejected and cannot be changed.</span>
                  )}

                  {/* Withdrawn — show reason */}
                  {app.status === "withdrawn" && (
                    <span className="va-locked-msg">Candidate withdrew this application.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewApplicants;