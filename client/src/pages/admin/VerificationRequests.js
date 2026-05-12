import React, { useEffect, useState } from "react";
import { getPendingVerifications, verifyCompany, rejectVerification } from "../../services/adminService";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import "./VerificationRequests.css";

const STATUS_COLOR = { pending:"#F59E0B", verified:"#10B981", rejected:"#EF4444", none:"#6B7280" };

const VerificationRequests = () => {
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [filter,    setFilter]    = useState("pending");
  const [rejectId,  setRejectId]  = useState(null);
  const [rejectNote,setRejectNote]= useState("");
  const [acting,    setActing]    = useState(null);

  const load = () => {
    setLoading(true);
    getPendingVerifications({ status: filter })
      .then(({ data }) => setCompanies(data.data || []))
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id) => {
    setActing(id);
    try {
      await verifyCompany(id);
      setSuccess("Company verified ✓");
      load();
    } catch (e) { setError(e.response?.data?.message || "Failed"); }
    finally { setActing(null); }
  };

  const handleReject = async () => {
    setActing(rejectId);
    try {
      await rejectVerification(rejectId, { note: rejectNote });
      setSuccess("Verification rejected");
      setRejectId(null); setRejectNote("");
      load();
    } catch (e) { setError(e.response?.data?.message || "Failed"); }
    finally { setActing(null); }
  };

  return (
    <div className="vr-page">
      <div className="vr-header">
        <div>
          <h1 className="vr-title">Company Verifications</h1>
          <p className="vr-sub">Review and approve company verification requests</p>
        </div>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {/* Reject modal */}
      {rejectId && (
        <div className="vr-overlay">
          <div className="vr-modal">
            <h3>Reject Verification</h3>
            <p>Provide a reason so the company knows what to fix:</p>
            <textarea
              className="vr-textarea"
              rows={4}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. GST number not provided, LinkedIn URL invalid..."
            />
            <div className="vr-modal-actions">
              <Button variant="ghost"  onClick={() => setRejectId(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleReject} loading={acting === rejectId}>Reject</Button>
            </div>
          </div>
        </div>
      )}

      <div className="vr-tabs">
        {["pending","verified","rejected","all"].map((s) => (
          <button key={s} className={`vr-tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="vr-list">
          {companies.map((co) => (
            <div key={co._id} className="vr-card">
              <div className="vr-card-top">
                <div className="vr-avatar">{co.companyName?.[0]?.toUpperCase()}</div>
                <div className="vr-info">
                  <div className="vr-name-row">
                    <span className="vr-name">{co.companyName}</span>
                    <span className="vr-status-badge" style={{ color: STATUS_COLOR[co.verificationStatus], background: STATUS_COLOR[co.verificationStatus] + "20", borderColor: STATUS_COLOR[co.verificationStatus] + "40" }}>
                      {co.verificationStatus}
                    </span>
                  </div>
                  <span className="vr-email">{co.user?.email}</span>
                  <div className="vr-meta">
                    {co.industry && <span>🏢 {co.industry}</span>}
                    {co.website  && <a href={co.website} target="_blank" rel="noreferrer" className="vr-link">🌐 Website</a>}
                    {co.linkedIn && <a href={co.linkedIn} target="_blank" rel="noreferrer" className="vr-link">💼 LinkedIn</a>}
                    {co.verificationDocs?.gstNumber && <span>📋 GST: {co.verificationDocs.gstNumber}</span>}
                  </div>
                </div>
                {co.verificationStatus === "pending" && (
                  <div className="vr-actions">
                    <Button variant="primary" size="sm" onClick={() => handleApprove(co._id)} loading={acting === co._id}>
                      ✓ Approve
                    </Button>
                    <Button variant="ghost"   size="sm" onClick={() => setRejectId(co._id)}>
                      ✕ Reject
                    </Button>
                  </div>
                )}
                {co.verificationStatus === "verified" && (
                  <span className="vr-verified-seal">✓ Verified</span>
                )}
              </div>
              {co.verificationNote && (
                <div className="vr-note">⚠ {co.verificationNote}</div>
              )}
              <div className="vr-dates">
                {co.verificationRequestedAt && <span>Requested: {new Date(co.verificationRequestedAt).toLocaleDateString("en-IN")}</span>}
                {co.verifiedAt && <span>Verified: {new Date(co.verifiedAt).toLocaleDateString("en-IN")}</span>}
              </div>
            </div>
          ))}
          {!companies.length && <div className="vr-empty">No {filter} verification requests</div>}
        </div>
      )}
    </div>
  );
};

export default VerificationRequests;