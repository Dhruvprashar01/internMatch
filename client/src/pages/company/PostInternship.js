import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createInternship } from "../../services/internshipService";
import Card, { CardHeader } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import "./PostInternship.css";

const PostInternship = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", location: "", duration: "",
    stipend: 0, openings: 1, isRemote: false, isPaid: false,
    experienceRequired: "fresher", educationRequired: "",
    applicationDeadline: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [prefSkillInput, setPrefSkillInput] = useState("");
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [preferredSkills, setPreferredSkills] = useState([]);
  const [responsibilities, setResponsibilities] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setF = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addSkill = (type) => {
    const val = type === "required" ? skillInput.trim() : prefSkillInput.trim();
    if (!val) return;
    if (type === "required") { setRequiredSkills((p) => [...new Set([...p, val])]); setSkillInput(""); }
    else { setPreferredSkills((p) => [...new Set([...p, val])]); setPrefSkillInput(""); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requiredSkills.length === 0) { setError("Add at least one required skill"); return; }
    setLoading(true); setError("");
    try {
      await createInternship({
        ...form,
        stipend: Number(form.stipend),
        openings: Number(form.openings),
        requiredSkills,
        preferredSkills,
        responsibilities: responsibilities.filter(Boolean),
      });
      navigate("/company/internships");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to post internship");
    } finally { setLoading(false); }
  };

  return (
    <div className="pi-page">
      <div className="pi-header">
        <h1 className="pi-title">Post New Internship</h1>
        <p className="pi-sub">Fill in the details to attract the best candidates</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError("")} />}

      <form onSubmit={handleSubmit} className="pi-form">
        <Card>
          <CardHeader title="Basic Details" />
          <div className="pi-grid-2">
            <div className="pi-field pi-span-2">
              <label>Internship Title *</label>
              <input value={form.title} onChange={(e) => setF("title", e.target.value)} required className="pi-input" placeholder="e.g. Full Stack Developer Intern" />
            </div>
            <div className="pi-field pi-span-2">
              <label>Description *</label>
              <textarea rows={5} value={form.description} onChange={(e) => setF("description", e.target.value)} required className="pi-textarea" placeholder="Describe the role, team, and what the intern will work on..." />
            </div>
            <div className="pi-field">
              <label>Location *</label>
              <input value={form.location} onChange={(e) => setF("location", e.target.value)} required className="pi-input" placeholder="e.g. Mumbai, Remote" />
            </div>
            <div className="pi-field">
              <label>Duration *</label>
              <input value={form.duration} onChange={(e) => setF("duration", e.target.value)} required className="pi-input" placeholder="e.g. 2 months, 6 months" />
            </div>
            <div className="pi-field">
              <label>Stipend (₹/month)</label>
              <input type="number" value={form.stipend} onChange={(e) => setF("stipend", e.target.value)} min={0} className="pi-input" placeholder="0 for unpaid" />
            </div>
            <div className="pi-field">
              <label>Number of Openings</label>
              <input type="number" value={form.openings} onChange={(e) => setF("openings", e.target.value)} min={1} className="pi-input" />
            </div>
            <div className="pi-field">
              <label>Experience Required</label>
              <select value={form.experienceRequired} onChange={(e) => setF("experienceRequired", e.target.value)} className="pi-select">
                {["fresher", "0-1 years", "1-2 years", "2+ years"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="pi-field">
              <label>Education Required</label>
              <input value={form.educationRequired} onChange={(e) => setF("educationRequired", e.target.value)} className="pi-input" placeholder="e.g. B.Tech, Any Graduate" />
            </div>
            <div className="pi-field">
              <label>Application Deadline</label>
              <input type="date" value={form.applicationDeadline} onChange={(e) => setF("applicationDeadline", e.target.value)} className="pi-input" />
            </div>
            <div className="pi-checkboxes">
              <label className="pi-checkbox-label">
                <input type="checkbox" checked={form.isRemote} onChange={(e) => setF("isRemote", e.target.checked)} />
                Remote position
              </label>
              <label className="pi-checkbox-label">
                <input type="checkbox" checked={form.isPaid} onChange={(e) => setF("isPaid", e.target.checked)} />
                Paid internship
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Skills" subtitle="Add required and preferred skills" />
          <div className="pi-skills-section">
            <div>
              <p className="pi-skills-label">Required Skills *</p>
              <div className="pi-skill-input-row">
                <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("required"))} className="pi-input" placeholder="e.g. Python, React..." />
                <Button type="button" variant="outline" size="sm" onClick={() => addSkill("required")}>Add</Button>
              </div>
              <div className="pi-chips">{requiredSkills.map((s) => <span key={s} className="pi-chip pi-chip-primary">{s}<button type="button" onClick={() => setRequiredSkills((p) => p.filter((x) => x !== s))}>✕</button></span>)}</div>
            </div>
            <div>
              <p className="pi-skills-label">Preferred Skills</p>
              <div className="pi-skill-input-row">
                <input value={prefSkillInput} onChange={(e) => setPrefSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("preferred"))} className="pi-input" placeholder="e.g. Docker, GraphQL..." />
                <Button type="button" variant="outline" size="sm" onClick={() => addSkill("preferred")}>Add</Button>
              </div>
              <div className="pi-chips">{preferredSkills.map((s) => <span key={s} className="pi-chip">{s}<button type="button" onClick={() => setPreferredSkills((p) => p.filter((x) => x !== s))}>✕</button></span>)}</div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Responsibilities" subtitle="Key tasks the intern will handle" />
          <div className="pi-resp-list">
            {responsibilities.map((r, i) => (
              <div key={i} className="pi-resp-row">
                <input value={r} onChange={(e) => setResponsibilities((p) => p.map((x, j) => j === i ? e.target.value : x))} className="pi-input" placeholder={`Responsibility ${i + 1}...`} />
                <button type="button" onClick={() => setResponsibilities((p) => p.filter((_, j) => j !== i))} className="pi-resp-remove">✕</button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={() => setResponsibilities((p) => [...p, ""])}>+ Add Responsibility</Button>
          </div>
        </Card>

        <div className="pi-submit-row">
          <Button type="button" variant="secondary" onClick={() => navigate("/company/internships")}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading} size="lg">Post Internship</Button>
        </div>
      </form>
    </div>
  );
};

export default PostInternship;
