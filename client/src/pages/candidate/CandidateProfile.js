import React, { useEffect, useState } from "react";
import { getProfile, updateProfile, uploadResume } from "../../services/candidateService";
import { getResumeData } from "../../services/candidateService";
import Card, { CardHeader } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import SkillTags from "../../components/common/SkillTags";
import Spinner from "../../components/common/Spinner";
import AtsScoreCard from "../../components/common/AtsScoreCard";
import "./CandidateProfile.css";

const DIVERSITY_OPTIONS = ["General", "SC", "ST", "OBC", "PWD", "EWS"];
const EXP_OPTIONS  = ["fresher", "0-1 years", "1-2 years", "2+ years"];
const AVAIL_OPTIONS= ["immediate", "1 month", "2 months", "3 months"];

const CandidateProfile = () => {
  const [profile,       setProfile]       = useState(null);
  const [form,          setForm]          = useState({});
  const [resumeData,    setResumeData]    = useState(null);
  const [atsScore,      setAtsScore]      = useState(null);
  const [skillInput,    setSkillInput]    = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [success,       setSuccess]       = useState("");
  const [error,         setError]         = useState("");

  useEffect(() => {
    Promise.all([
      getProfile(),
      getResumeData().catch(() => null),
    ]).then(([profRes, resumeRes]) => {
      const p = profRes.data.data;
      setProfile(p);
      setForm({
        bio: p.bio || "", phone: p.phone || "",
        currentLocation: p.currentLocation || "",
        experienceLevel: p.experienceLevel || "fresher",
        availability: p.availability || "immediate",
        diversityCategory: p.diversityCategory || "General",
        linkedIn: p.linkedIn || "", github: p.github || "",
        skills: p.skills || [], locationPreferences: p.locationPreferences || [],
      });
      if (resumeRes?.data?.data) {
        setResumeData(resumeRes.data.data);
        setAtsScore(resumeRes.data.data.atsScore || null);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const { data } = await updateProfile(form);
      setProfile(data.data);
      setSuccess("Profile updated successfully!");
    } catch (e) { setError(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("resume", file);
    setUploading(true); setError(""); setSuccess("");
    try {
      const { data } = await uploadResume(fd);
      const filled = data.data?.autoFilled;
      if (filled?.skills?.length) setForm((f) => ({ ...f, skills: filled.skills }));
      // Show ATS score returned from upload
      if (data.data?.atsScore) setAtsScore(data.data.atsScore);
      setSuccess(`Resume parsed! ${filled?.skills?.length || 0} skills, ${filled?.educationCount || 0} education entries found.`);
    } catch (e) { setError(e.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const addSkill     = () => { const s = skillInput.trim(); if (s && !form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] })); setSkillInput(""); };
  const removeSkill  = (sk) => setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== sk) }));
  const addLocation  = () => { const l = locationInput.trim(); if (l && !form.locationPreferences.includes(l)) setForm((f) => ({ ...f, locationPreferences: [...f.locationPreferences, l] })); setLocationInput(""); };
  const removeLocation = (loc) => setForm((f) => ({ ...f, locationPreferences: f.locationPreferences.filter((l) => l !== loc) }));

  if (loading) return <Spinner label="Loading profile..." />;

  return (
    <div className="cp-page">
      <div className="cp-header">
        <h1 className="cp-title">My Profile</h1>
        <Button onClick={handleSave} loading={saving} variant="primary">Save Changes</Button>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}
      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}

      <div className="cp-grid">
        {/* Left column */}
        <div className="cp-col">
          <Card>
            <CardHeader title="Basic Information" />
            <div className="cp-form">
              <div className="cp-field">
                <label>Bio</label>
                <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A brief introduction about yourself..." className="cp-textarea" />
              </div>
              <div className="cp-row">
                <div className="cp-field">
                  <label>Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" className="cp-input" />
                </div>
                <div className="cp-field">
                  <label>Current Location</label>
                  <input value={form.currentLocation} onChange={(e) => setForm({ ...form, currentLocation: e.target.value })} placeholder="Mumbai, India" className="cp-input" />
                </div>
              </div>
              <div className="cp-row">
                <div className="cp-field">
                  <label>LinkedIn</label>
                  <input value={form.linkedIn} onChange={(e) => setForm({ ...form, linkedIn: e.target.value })} placeholder="https://linkedin.com/in/..." className="cp-input" />
                </div>
                <div className="cp-field">
                  <label>GitHub</label>
                  <input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} placeholder="https://github.com/..." className="cp-input" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Skills" subtitle="Add technologies and tools you know" />
            <div className="cp-tag-input-row">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} placeholder="e.g. React, Python, Docker..." className="cp-input" />
              <Button onClick={addSkill} variant="outline" size="sm">Add</Button>
            </div>
            <div className="cp-skills-grid">
              {form.skills.map((s) => (
                <div key={s} className="cp-skill-chip">{s}<button onClick={() => removeSkill(s)} className="cp-chip-remove">✕</button></div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Location Preferences" subtitle="Where you want to intern" />
            <div className="cp-tag-input-row">
              <input value={locationInput} onChange={(e) => setLocationInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLocation()} placeholder="e.g. Mumbai, Remote..." className="cp-input" />
              <Button onClick={addLocation} variant="outline" size="sm">Add</Button>
            </div>
            <div className="cp-loc-chips">
              {form.locationPreferences.map((l) => (
                <div key={l} className="cp-loc-chip">📍 {l}<button onClick={() => removeLocation(l)} className="cp-chip-remove">✕</button></div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="cp-col">
          <Card>
            <CardHeader title="Resume Upload" subtitle="PDF or DOCX — AI will auto-fill your profile" />
            {profile?.resumeUrl && (
              <div className="cp-resume-current">
                <span>📄 {profile.resumeOriginalName || "Current Resume"}</span>
                <a href={`http://localhost:5000${profile.resumeUrl}`} target="_blank" rel="noreferrer" className="cp-resume-link">View →</a>
              </div>
            )}
            <label className="cp-upload-zone">
              <input type="file" accept=".pdf,.docx" onChange={handleResumeUpload} className="cp-upload-input" />
              {uploading ? (
                <div className="cp-upload-loading"><Spinner size="sm" label="Parsing resume + calculating ATS score..." /></div>
              ) : (
                <div className="cp-upload-content">
                  <span className="cp-upload-icon">⬆</span>
                  <span className="cp-upload-text">Click or drag to upload resume</span>
                  <span className="cp-upload-sub">PDF or DOCX, max 5MB</span>
                </div>
              )}
            </label>
          </Card>

          {/* ATS Score Card — shown after resume upload */}
          <AtsScoreCard
            atsScore={atsScore}
            title="Resume ATS Score"
            compact={false}
          />

          <Card>
            <CardHeader title="Career Details" />
            <div className="cp-form">
              <div className="cp-field">
                <label>Experience Level</label>
                <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} className="cp-select">
                  {EXP_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="cp-field">
                <label>Availability</label>
                <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="cp-select">
                  {AVAIL_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="cp-field">
                <label>Diversity Category</label>
                <select value={form.diversityCategory} onChange={(e) => setForm({ ...form, diversityCategory: e.target.value })} className="cp-select">
                  {DIVERSITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <span className="cp-field-hint">Used for fairness-aware recommendations</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;