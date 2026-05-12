import React, { useEffect, useState } from "react";
import { getMyApplications, withdrawApplication } from "../../services/candidateService";
import StatusTracker from "../../components/common/StatusTracker";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import "./MyApplications.css";

const STATUS_VARIANT = {
  pending:"default", reviewed:"info", shortlisted:"warning",
  accepted:"success", rejected:"danger", withdrawn:"default", completed:"success",
};

const MyApplications = () => {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [filter,  setFilter]  = useState("all");
  const [expanded,setExpanded]= useState(null); // which app shows timeline

  useEffect(() => {
    getMyApplications()
      .then(({ data }) => setApps(data.data || []))
      .catch((e) => setError(e.response?.data?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async (id) => {
    try {
      await withdrawApplication(id);
      setApps((prev) => prev.map((a) => a._id === id ? { ...a, status: "withdrawn" } : a));
      setSuccess("Application withdrawn");
    } catch (e) { setError(e.response?.data?.message || "Failed to withdraw"); }
  };

  const handleDownloadCert = (appId) => {
    const token = localStorage.getItem("token");
    window.open(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/applications/certificate/${appId}?token=${token}`,
      "_blank"
    );
  };

  const FILTERS = ["all","pending","shortlisted","accepted","completed","rejected"];
  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  if (loading) return <Spinner label="Loading applications..." />;

  return (
    <div className="myapps-page">
      <div className="myapps-header">
        <h1 className="myapps-title">My Applications</h1>
        <span className="myapps-count">{apps.length} total</span>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      <div className="myapps-filters">
        {FILTERS.map((s) => (
          <button key={s} className={`myapps-filter ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="myapps-filter-count">
              {s === "all" ? apps.length : apps.filter((a) => a.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="myapps-empty">No {filter === "all" ? "" : filter} applications yet.</div>
      ) : (
        <div className="myapps-list">
          {filtered.map((app) => (
            <div key={app._id} className="myapp-card">
              {/* Card top row */}
              <div className="myapp-row">
                <div className="myapp-avatar">
                  {app.internship?.company?.companyName?.[0] || "?"}
                </div>
                <div className="myapp-info">
                  <div className="myapp-title-row">
                    <h3 className="myapp-title">{app.internship?.title}</h3>
                    {app.internship?.company?.isVerified && (
                      <span className="myapp-verified-badge" title="Verified Company">✓ Verified</span>
                    )}
                  </div>
                  <span className="myapp-company">{app.internship?.company?.companyName}</span>
                  <div className="myapp-meta">
                    <span>📍 {app.internship?.location}</span>
                    <span>⏱ {app.internship?.duration}</span>
                    <span>Applied {new Date(app.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
                <div className="myapp-right">
                  <Badge variant={STATUS_VARIANT[app.status] || "default"}>{app.status}</Badge>
                  <div className="myapp-score">{app.matchScore}% match</div>

                  {/* Certificate download button */}
                  {app.status === "completed" && app.certificate?.certificateId && (
                    <Button variant="primary" size="sm" onClick={() => handleDownloadCert(app._id)}>
                      🏆 Download Certificate
                    </Button>
                  )}

                  {["pending","reviewed"].includes(app.status) && (
                    <Button variant="ghost" size="sm" onClick={() => handleWithdraw(app._id)}>Withdraw</Button>
                  )}
                </div>
              </div>

              {/* AI explanation */}
              {app.aiExplanation && (
                <div className="myapp-explanation">
                  <span className="myapp-exp-label">✦ AI Match Reason</span>
                  <p>{app.aiExplanation}</p>
                </div>
              )}

              {/* Status tracker toggle */}
              <button
                className="myapp-tracker-toggle"
                onClick={() => setExpanded(expanded === app._id ? null : app._id)}
              >
                {expanded === app._id ? "▲ Hide tracker" : "▼ Track application status"}
              </button>

              {expanded === app._id && (
                <StatusTracker status={app.status} timeline={app.timeline || []} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications;