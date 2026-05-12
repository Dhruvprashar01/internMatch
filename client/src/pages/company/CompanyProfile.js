import React, { useEffect, useState } from "react";
import { getCompanyProfile, updateCompanyProfile, requestVerification } from "../../services/companyService";
import Card, { CardHeader } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import "./CompanyProfile.css";

const VERIFICATION_CONFIG = {
  none:     { label: "Not Verified",       color: "#6B7280", bg: "rgba(107,114,128,0.1)",  border: "rgba(107,114,128,0.2)" },
  pending:  { label: "Pending Review",     color: "#F59E0B", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.25)" },
  verified: { label: "✓ Verified Company", color: "#10B981", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.25)" },
  rejected: { label: "Verification Rejected", color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
};

const CompanyProfile = () => {
  const [profile,     setProfile]     = useState(null);
  const [form,        setForm]        = useState({
    companyName:"", description:"", industry:"", website:"",
    headquarters:"", size:"", contactEmail:"", contactPhone:"", linkedIn:"",
  });
  const [verifyForm,  setVerifyForm]  = useState({ gstNumber:"", linkedInUrl:"", websiteUrl:"" });
  const [showVerify,  setShowVerify]  = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [requesting,  setRequesting]  = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    getCompanyProfile()
      .then(({ data }) => {
        const d = data.data;
        setProfile(d);
        setForm({
          companyName:  d.companyName  || "",
          description:  d.description  || "",
          industry:     d.industry     || "",
          website:      d.website      || "",
          headquarters: d.headquarters || "",
          size:         d.size         || "",
          contactEmail: d.contactEmail || "",
          contactPhone: d.contactPhone || "",
          linkedIn:     d.linkedIn     || "",
        });
        setVerifyForm({
          gstNumber:   d.verificationDocs?.gstNumber   || "",
          linkedInUrl: d.verificationDocs?.linkedInUrl || d.linkedIn || "",
          websiteUrl:  d.verificationDocs?.websiteUrl  || d.website  || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const { data } = await updateCompanyProfile(form);
      setProfile(data.data);
      setSuccess("Company profile updated!");
    } catch (e) { setError(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleRequestVerification = async () => {
    setRequesting(true); setError(""); setSuccess("");
    try {
      await requestVerification(verifyForm);
      setProfile((p) => ({ ...p, verificationStatus: "pending" }));
      setShowVerify(false);
      setSuccess("Verification request submitted! Admin will review within 24-48 hours.");
    } catch (e) { setError(e.response?.data?.message || "Request failed"); }
    finally { setRequesting(false); }
  };

  if (loading) return <Spinner />;

  const verStatus = profile?.verificationStatus || "none";
  const verConfig = VERIFICATION_CONFIG[verStatus] || VERIFICATION_CONFIG.none;

  return (
    <div className="cp2-page">
      <div className="cp2-header">
        <h1 className="cp2-title">Company Profile</h1>
        <Button variant="primary" loading={saving} onClick={handleSave}>Save Changes</Button>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {/* ── Verification Status Banner ────────────────────────────────── */}
      <div className="cp2-verify-banner" style={{ background: verConfig.bg, border: `1px solid ${verConfig.border}` }}>
        <div className="cp2-verify-left">
          <span className="cp2-verify-status" style={{ color: verConfig.color }}>
            {verStatus === "verified" ? "🏆" : verStatus === "pending" ? "⏳" : verStatus === "rejected" ? "✕" : "○"}
            {" "}{verConfig.label}
          </span>
          {verStatus === "none" && (
            <p className="cp2-verify-desc">
              Get a <strong>Verified Badge</strong> on all your internship listings. Candidates trust verified companies 3x more.
            </p>
          )}
          {verStatus === "pending" && (
            <p className="cp2-verify-desc">Your request is under review. Admin will verify within 24-48 hours.</p>
          )}
          {verStatus === "verified" && (
            <p className="cp2-verify-desc">Your company is verified. A ✓ badge appears on all your listings.</p>
          )}
          {verStatus === "rejected" && (
            <p className="cp2-verify-desc">
              {profile?.verificationNote || "Verification was rejected."} Please fix the issues and reapply.
            </p>
          )}
        </div>

        {(verStatus === "none" || verStatus === "rejected") && (
          <Button variant="primary" size="sm" onClick={() => setShowVerify(!showVerify)}>
            {showVerify ? "Cancel" : "🛡 Apply for Verification"}
          </Button>
        )}
      </div>

      {/* ── Verification Form ──────────────────────────────────────────── */}
      {showVerify && (
        <Card>
          <CardHeader
            title="Verification Documents"
            subtitle="Provide at least one document for admin to verify your company"
          />
          <div className="cp2-form">
            <div className="cp2-field">
              <label>GST Number <span className="cp2-optional">(recommended)</span></label>
              <input
                value={verifyForm.gstNumber}
                onChange={(e) => setVerifyForm((f) => ({ ...f, gstNumber: e.target.value }))}
                className="cp2-input"
                placeholder="e.g. 29ABCDE1234F1Z5"
              />
            </div>
            <div className="cp2-field">
              <label>Company LinkedIn URL</label>
              <input
                value={verifyForm.linkedInUrl}
                onChange={(e) => setVerifyForm((f) => ({ ...f, linkedInUrl: e.target.value }))}
                className="cp2-input"
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>
            <div className="cp2-field">
              <label>Official Website</label>
              <input
                value={verifyForm.websiteUrl}
                onChange={(e) => setVerifyForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                className="cp2-input"
                placeholder="https://yourcompany.com"
              />
            </div>
            <div className="cp2-verify-note">
              ℹ Admin will check your documents and approve within 24-48 hours. You will see the status update here.
            </div>
            <Button variant="primary" loading={requesting} onClick={handleRequestVerification}>
              Submit for Verification
            </Button>
          </div>
        </Card>
      )}

      {/* ── Profile Form ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Company Information" />
        <div className="cp2-form">
          <div className="cp2-row">
            <div className="cp2-field">
              <label>Company Name</label>
              <input value={form.companyName} onChange={(e) => setF("companyName", e.target.value)} className="cp2-input" placeholder="Acme Corp" />
            </div>
            <div className="cp2-field">
              <label>Industry</label>
              <input value={form.industry} onChange={(e) => setF("industry", e.target.value)} className="cp2-input" placeholder="Technology, Finance..." />
            </div>
          </div>
          <div className="cp2-row">
            <div className="cp2-field">
              <label>Headquarters</label>
              <input value={form.headquarters} onChange={(e) => setF("headquarters", e.target.value)} className="cp2-input" placeholder="Mumbai, India" />
            </div>
            <div className="cp2-field">
              <label>Website</label>
              <input value={form.website} onChange={(e) => setF("website", e.target.value)} className="cp2-input" placeholder="https://yourcompany.com" />
            </div>
          </div>
          <div className="cp2-row">
            <div className="cp2-field">
              <label>Company Size</label>
              <select value={form.size} onChange={(e) => setF("size", e.target.value)} className="cp2-select">
                <option value="">Select size</option>
                {["1-10","11-50","51-200","201-500","501-1000","1000+"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="cp2-field">
              <label>Contact Email</label>
              <input value={form.contactEmail} onChange={(e) => setF("contactEmail", e.target.value)} className="cp2-input" placeholder="hr@company.com" />
            </div>
          </div>
          <div className="cp2-row">
            <div className="cp2-field">
              <label>Contact Phone</label>
              <input value={form.contactPhone} onChange={(e) => setF("contactPhone", e.target.value)} className="cp2-input" placeholder="+91 98765 43210" />
            </div>
            <div className="cp2-field">
              <label>LinkedIn</label>
              <input value={form.linkedIn} onChange={(e) => setF("linkedIn", e.target.value)} className="cp2-input" placeholder="https://linkedin.com/company/..." />
            </div>
          </div>
          <div className="cp2-field">
            <label>About the Company</label>
            <textarea rows={5} value={form.description} onChange={(e) => setF("description", e.target.value)} className="cp2-textarea" placeholder="Describe your company, mission, and culture..." />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CompanyProfile;