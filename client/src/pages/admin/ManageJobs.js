import React, { useEffect, useState, useCallback } from "react";
import { getAllInternships, deleteInternship } from "../../services/adminService";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import "./ManageJobs.css";

const STATUS_OPTIONS = ["all", "active", "closed", "draft"];

const ManageJobs = () => {
  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [status,    setStatus]    = useState("all");
  const [search,    setSearch]    = useState("");
  const [confirm,   setConfirm]   = useState(null);
  const [deleting,  setDeleting]  = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status !== "all") params.status = status;
      if (search.trim()) params.search = search.trim();
      const { data } = await getAllInternships(params);
      setJobs(data.data || []);
    } catch { setError("Failed to load internships"); }
    finally { setLoading(false); }
  }, [status, search]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleDelete = async (id) => {
    setDeleting(id); setConfirm(null);
    try {
      await deleteInternship(id);
      setJobs((p) => p.filter((j) => j._id !== id));
      setSuccess("Internship deleted");
    } catch (e) { setError(e.response?.data?.message || "Delete failed"); }
    finally { setDeleting(null); }
  };

  const STATUS_COLOR = { active: "#10B981", closed: "#6B7280", draft: "#F59E0B" };

  return (
    <div className="mj-page">
      <div className="mj-header">
        <div>
          <h1 className="mj-title">Job Management</h1>
          <p className="mj-sub">{jobs.length} internships found</p>
        </div>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {confirm && (
        <div className="mj-overlay">
          <div className="mj-confirm-box">
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🗑</div>
            <h3>Delete Internship?</h3>
            <p>This will permanently remove this listing. Existing applications will remain in the database.</p>
            <div className="mj-confirm-actions">
              <button className="mj-btn mj-btn-ghost"  onClick={() => setConfirm(null)}>Cancel</button>
              <button className="mj-btn mj-btn-danger" onClick={() => handleDelete(confirm)} disabled={deleting === confirm}>
                {deleting === confirm ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mj-filters">
        <input
          className="mj-search"
          placeholder="🔍  Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchJobs()}
        />
        <div className="mj-tabs">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} className={`mj-tab ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="mj-table-wrap">
          <table className="mj-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Status</th>
                <th>Apps</th>
                <th>Posted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j._id}>
                  <td>
                    <div className="mj-job-title">{j.title}</div>
                    <div className="mj-job-duration">{j.duration}</div>
                  </td>
                  <td className="mj-company">{j.company?.companyName || "—"}</td>
                  <td className="mj-loc">📍 {j.location}</td>
                  <td>
                    <span className="mj-status" style={{ color: STATUS_COLOR[j.status], background: STATUS_COLOR[j.status] + "20", borderColor: STATUS_COLOR[j.status] + "40" }}>
                      {j.status}
                    </span>
                  </td>
                  <td className="mj-apps">{j.applicationCount || 0}</td>
                  <td className="mj-date">{new Date(j.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                    <button className="mj-btn mj-btn-danger" onClick={() => setConfirm(j._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!jobs.length && <tr><td colSpan={7} className="mj-empty">No internships found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageJobs;