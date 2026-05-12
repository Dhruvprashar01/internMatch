import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getInternshipById } from "../../services/internshipService";
import { applyToInternship } from "../../services/candidateService";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import SkillTags from "../../components/common/SkillTags";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";

const InternshipDetails = () => {
  const { id } = useParams();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  useEffect(() => {
    getInternshipById(id)
      .then(({ data }) => setInternship(data.data))
      .catch(() => setError("Internship not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await applyToInternship(id, {});
      setApplied(true);
      setSuccess("Application submitted successfully!");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Spinner label="Loading internship..." />;
  if (!internship && error) return <Alert type="error" message={error} />;

  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp 0.4s ease" }}>
      <Link to="/candidate/recommendations" style={{ color: "var(--clr-text-2)", fontSize: "0.88rem" }}>← Back to Recommendations</Link>

      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, background: "var(--clr-primary-dim)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--clr-primary)", fontSize: "1.2rem" }}>
              {internship?.company?.companyName?.[0]}
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800 }}>{internship?.title}</h1>
              <p style={{ color: "var(--clr-text-2)", fontSize: "0.9rem" }}>{internship?.company?.companyName}</p>
            </div>
          </div>
          <Button variant={applied ? "ghost" : "primary"} disabled={applied} loading={applying} onClick={handleApply}>
            {applied ? "✓ Applied" : "Apply Now"}
          </Button>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <span style={{ color: "var(--clr-text-2)", fontSize: "0.85rem" }}>📍 {internship?.location}</span>
          <span style={{ color: "var(--clr-text-2)", fontSize: "0.85rem" }}>⏱ {internship?.duration}</span>
          {internship?.stipend > 0 && <span style={{ color: "var(--clr-text-2)", fontSize: "0.85rem" }}>💰 ₹{internship?.stipend?.toLocaleString()}/mo</span>}
          {internship?.openings && <span style={{ color: "var(--clr-text-2)", fontSize: "0.85rem" }}>👥 {internship.openings} opening(s)</span>}
          {internship?.isRemote && <Badge variant="info">Remote</Badge>}
          <Badge variant={internship?.status === "active" ? "success" : "default"}>{internship?.status}</Badge>
        </div>

        <div style={{ color: "var(--clr-text-2)", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: 20 }}>{internship?.description}</div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--clr-text-2)", marginBottom: 8 }}>REQUIRED SKILLS</p>
          <SkillTags skills={internship?.requiredSkills || []} variant="primary" />
        </div>
        {internship?.preferredSkills?.length > 0 && (
          <div>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--clr-text-2)", marginBottom: 8 }}>PREFERRED SKILLS</p>
            <SkillTags skills={internship?.preferredSkills || []} />
          </div>
        )}
      </Card>

      {internship?.responsibilities?.length > 0 && (
        <Card>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 12 }}>Responsibilities</h3>
          <ul style={{ paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            {internship.responsibilities.map((r, i) => (
              <li key={i} style={{ color: "var(--clr-text-2)", fontSize: "0.9rem" }}>{r}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default InternshipDetails;
