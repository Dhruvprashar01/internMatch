import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPlatformStats } from "../../services/adminService";
import Spinner from "../../components/common/Spinner";
import "./AdminDashboard.css";

const StatCard = ({ label, value, icon, color, to }) => (
  <Link to={to || "#"} className="adm-stat-card" style={{ "--card-color": color }}>
    <div className="adm-stat-icon">{icon}</div>
    <div className="adm-stat-value">{value ?? "—"}</div>
    <div className="adm-stat-label">{label}</div>
    <div className="adm-stat-glow" />
  </Link>
);

const AdminDashboard = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading dashboard..." />;

  const ov  = stats?.overview || {};
  const max = ov.totalApplications || 1;

  const STATUS_COLOR = {
    pending: "#F59E0B", reviewed: "#60A5FA", shortlisted: "#A78BFA",
    accepted: "#10B981", rejected: "#EF4444", withdrawn: "#6B7280",
  };

  return (
    <div className="adm-page">
      {/* Header */}
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Admin Dashboard <span className="text-primary">⬡</span></h1>
          <p className="adm-sub">Platform overview · {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
        </div>
        <div className="adm-header-badges">
          <span className="adm-badge adm-badge-live">● Live</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="adm-stats-grid">
        <StatCard label="Total Users"        value={ov.totalUsers}        icon="◎" color="#00D4C8" to="/admin/users" />
        <StatCard label="Candidates"         value={ov.totalCandidates}   icon="✦" color="#60A5FA" to="/admin/users" />
        <StatCard label="Companies"          value={ov.totalCompanies}    icon="⬡" color="#F59E0B" to="/admin/users" />
        <StatCard label="Active Internships" value={ov.activeInternships} icon="◈" color="#10B981" to="/admin/jobs" />
        <StatCard label="Total Internships"  value={ov.totalInternships}  icon="★" color="#F472B6" to="/admin/jobs" />
        <StatCard label="Applications"       value={ov.totalApplications} icon="→" color="#A78BFA" to="/admin/applications" />
      </div>

      {/* Two-column grid */}
      <div className="adm-grid">
        {/* Recent Users */}
        <div className="adm-card">
          <div className="adm-card-header">
            <div>
              <h3 className="adm-card-title">Recent Registrations</h3>
              <p className="adm-card-sub">Latest users to join the platform</p>
            </div>
            <Link to="/admin/users" className="adm-card-link">View all →</Link>
          </div>
          <div className="adm-user-list">
            {(stats?.recentUsers || []).map((u) => (
              <div key={u._id} className="adm-user-row">
                <div className="adm-avatar">{u.name?.[0]?.toUpperCase()}</div>
                <div className="adm-user-info">
                  <span className="adm-user-name">{u.name}</span>
                  <span className="adm-user-email">{u.email}</span>
                </div>
                <span className={`adm-role-badge adm-role-${u.role}`}>{u.role}</span>
              </div>
            ))}
            {!stats?.recentUsers?.length && <p className="adm-empty">No users yet</p>}
          </div>
        </div>

        {/* Applications by Status */}
        <div className="adm-card">
          <div className="adm-card-header">
            <div>
              <h3 className="adm-card-title">Application Pipeline</h3>
              <p className="adm-card-sub">Status breakdown across all applications</p>
            </div>
            <Link to="/admin/applications" className="adm-card-link">View all →</Link>
          </div>
          <div className="adm-pipeline">
            {(stats?.applicationsByStatus || []).map(({ _id, count }) => (
              <div key={_id} className="adm-pipeline-row">
                <span className="adm-pipeline-label">{_id}</span>
                <div className="adm-pipeline-track">
                  <div
                    className="adm-pipeline-fill"
                    style={{
                      width: `${Math.min((count / max) * 100, 100)}%`,
                      background: STATUS_COLOR[_id] || "var(--clr-primary)",
                    }}
                  />
                </div>
                <span className="adm-pipeline-count">{count}</span>
              </div>
            ))}
            {!stats?.applicationsByStatus?.length && <p className="adm-empty">No applications yet</p>}
          </div>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="adm-quick-nav">
        {[
          { to: "/admin/users",        icon: "◎", label: "User Management",    sub: "View, activate, delete users" },
          { to: "/admin/jobs",         icon: "◈", label: "Job Management",     sub: "Monitor & remove internships" },
          { to: "/admin/applications", icon: "→", label: "Applications",       sub: "Track all submissions" },
          { to: "/admin/diversity",    icon: "✦", label: "Diversity Report",   sub: "Fairness & representation" },
          { to: "/admin/stats",        icon: "★", label: "Platform Analytics", sub: "Full statistics overview" },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="adm-quick-card">
            <span className="adm-quick-icon">{item.icon}</span>
            <div>
              <div className="adm-quick-label">{item.label}</div>
              <div className="adm-quick-sub">{item.sub}</div>
            </div>
            <span className="adm-quick-arrow">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;