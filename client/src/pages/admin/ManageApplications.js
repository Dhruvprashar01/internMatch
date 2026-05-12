import React, { useEffect, useState } from "react";
import { getAllApplications } from "../../services/adminService";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import "./ManageApplications.css";

const STATUSES = ["all","pending","reviewed","shortlisted","accepted","rejected","withdrawn"];
const STATUS_COLOR = { pending:"#F59E0B", reviewed:"#60A5FA", shortlisted:"#A78BFA", accepted:"#10B981", rejected:"#EF4444", withdrawn:"#6B7280" };

const ManageApplications = () => {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [status,  setStatus]  = useState("all");

  useEffect(() => {
    setLoading(true);
    const params = status !== "all" ? { status } : {};
    getAllApplications(params)
      .then(({ data }) => setApps(data.data || []))
      .catch(() => setError("Failed to load applications"))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="ma-page">
      <div className="ma-header">
        <div>
          <h1 className="ma-title">Application Monitor</h1>
          <p className="ma-sub">{apps.length} applications found</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError("")} />}

      <div className="ma-tabs">
        {STATUSES.map((s) => (
          <button key={s} className={`ma-tab ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}
            style={status === s && s !== "all" ? { borderColor: STATUS_COLOR[s], color: STATUS_COLOR[s], background: STATUS_COLOR[s] + "20" } : {}}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="ma-table-wrap">
          <table className="ma-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Internship</th>
                <th>Company</th>
                <th>Match</th>
                <th>Status</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a._id}>
                  <td>
                    <div className="ma-cand-name">{a.candidate?.user?.name || "—"}</div>
                    <div className="ma-cand-email">{a.candidate?.user?.email || ""}</div>
                  </td>
                  <td className="ma-job">{a.internship?.title || "—"}</td>
                  <td className="ma-company">{a.internship?.company?.companyName || "—"}</td>
                  <td>
                    <span className="ma-score" style={{ color: a.matchScore >= 60 ? "#10B981" : a.matchScore >= 40 ? "#F59E0B" : "#EF4444" }}>
                      {a.matchScore}%
                    </span>
                  </td>
                  <td>
                    <span className="ma-status" style={{ color: STATUS_COLOR[a.status] || "#6B7280", background: (STATUS_COLOR[a.status] || "#6B7280") + "20", borderColor: (STATUS_COLOR[a.status] || "#6B7280") + "40" }}>
                      {a.status}
                    </span>
                  </td>
                  <td className="ma-date">{new Date(a.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
              {!apps.length && <tr><td colSpan={6} className="ma-empty">No applications found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageApplications;