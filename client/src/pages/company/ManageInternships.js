import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyInternships, deleteInternship, updateInternship } from "../../services/internshipService";
import Card, { CardHeader } from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import SkillTags from "../../components/common/SkillTags";

const ManageInternships = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    getMyInternships().then(({ data }) => setInternships(data.data || []))
      .catch((e) => setError(e.response?.data?.message || "Failed")).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this internship?")) return;
    try {
      await deleteInternship(id);
      setInternships((p) => p.filter((i) => i._id !== id));
      setSuccess("Internship deleted");
    } catch (e) { setError(e.response?.data?.message || "Delete failed"); }
  };

  const toggleStatus = async (int) => {
    const newStatus = int.status === "active" ? "closed" : "active";
    try {
      await updateInternship(int._id, { status: newStatus });
      setInternships((p) => p.map((i) => i._id === int._id ? { ...i, status: newStatus } : i));
    } catch (e) { setError("Status update failed"); }
  };

  if (loading) return <Spinner label="Loading internships..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp 0.4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800 }}>Manage Internships</h1>
        <Link to="/company/post-internship"><Button variant="primary">+ Post New</Button></Link>
      </div>
      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}
      {internships.map((int) => (
        <Card key={int._id} padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4 }}>{int.title}</h3>
              <div style={{ display: "flex", gap: 14, fontSize: "0.82rem", color: "var(--clr-text-2)", flexWrap: "wrap" }}>
                <span>📍 {int.location}</span><span>⏱ {int.duration}</span>
                <span>👥 {int.applicationCount || 0} applicants</span>
                {int.stipend > 0 && <span>💰 ₹{int.stipend.toLocaleString()}/mo</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <Badge variant={int.status === "active" ? "success" : "default"}>{int.status}</Badge>
              <Button variant="outline" size="sm" onClick={() => toggleStatus(int)}>
                {int.status === "active" ? "Close" : "Reopen"}
              </Button>
              <Link to={`/company/applicants/${int._id}`}><Button variant="secondary" size="sm">Applicants</Button></Link>
              <Button variant="danger" size="sm" onClick={() => handleDelete(int._id)}>Delete</Button>
            </div>
          </div>
          <SkillTags skills={int.requiredSkills || []} max={8} />
        </Card>
      ))}
      {internships.length === 0 && (
        <Card padding="lg"><div style={{ textAlign: "center", padding: "32px", color: "var(--clr-text-2)" }}>
          <p style={{ marginBottom: 12 }}>No internships posted yet.</p>
          <Link to="/company/post-internship"><Button variant="primary">Post Your First Internship</Button></Link>
        </div></Card>
      )}
    </div>
  );
};

export default ManageInternships;
