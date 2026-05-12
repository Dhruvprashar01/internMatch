import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import "./VerifyCertificate.css";

const VerifyCertificate = () => {
  const { certId } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/applications/verify/${certId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError("Certificate not found or invalid.");
      })
      .catch(() => setError("Could not verify certificate."))
      .finally(() => setLoading(false));
  }, [certId]);

  if (loading) return <div className="vc-page"><Spinner label="Verifying certificate..." /></div>;

  return (
    <div className="vc-page">
      <div className="vc-card">
        <div className="vc-logo">✦ InternMatch AI</div>
        {error ? (
          <>
            <div className="vc-invalid-icon">✕</div>
            <h2 className="vc-invalid-title">Invalid Certificate</h2>
            <p className="vc-invalid-sub">{error}</p>
          </>
        ) : (
          <>
            <div className="vc-valid-icon">✓</div>
            <h2 className="vc-valid-title">Certificate Verified</h2>
            <p className="vc-valid-sub">This is an authentic InternMatch AI certificate</p>

            <div className="vc-details">
              <div className="vc-row"><span>Candidate</span><strong>{data.candidateName}</strong></div>
              <div className="vc-row"><span>Role</span><strong>{data.internshipTitle}</strong></div>
              <div className="vc-row"><span>Company</span><strong>{data.companyName}</strong></div>
              <div className="vc-row"><span>Duration</span><strong>{data.duration}</strong></div>
              <div className="vc-row"><span>Issued On</span><strong>{new Date(data.issuedAt).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</strong></div>
              <div className="vc-row"><span>Certificate ID</span><strong className="vc-cert-id">{data.certificateId}</strong></div>
            </div>

            {data.skills?.length > 0 && (
              <div className="vc-skills">
                {data.skills.map((s) => <span key={s} className="vc-skill">{s}</span>)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;