import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./DashboardLayout.css";

const NAV_LINKS = {
  candidate: [
    { path: "/candidate",              label: "Dashboard",    icon: "⬡" },
    { path: "/candidate/recommendations", label: "Recommendations", icon: "✦" },
    { path: "/candidate/applications",  label: "Applications", icon: "◈" },
    { path: "/candidate/profile",       label: "My Profile",   icon: "◎" },
  ],
  company: [
    { path: "/company",              label: "Dashboard",    icon: "⬡" },
    { path: "/company/internships",  label: "Internships",  icon: "◈" },
    { path: "/company/post-internship", label: "Post New",  icon: "✦" },
    { path: "/company/profile",      label: "Company Profile", icon: "◎" },
  ],
  admin: [
    { path: "/admin",             label: "Overview",     icon: "⬡" },
    { path: "/admin/users",       label: "Users",        icon: "◎" },
    { path: "/admin/jobs",        label: "Jobs",         icon: "◈" },
    { path: "/admin/applications",label: "Applications", icon: "→" },
    { path: "/admin/diversity",   label: "Diversity",    icon: "✦" },
    { path: "/admin/stats",       label: "Analytics",   icon: "★" },
    { path: "/admin/verifications", label: "Verifications", icon: "✓" },
  ],
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = NAV_LINKS[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dash-shell">
      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="dash-logo">
          <span className="dash-logo-mark">IM</span>
          <span className="dash-logo-text">InternMatch</span>
        </div>

        <nav className="dash-nav">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`dash-nav-item ${location.pathname === link.path ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="dash-nav-icon">{link.icon}</span>
              <span className="dash-nav-label">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-user-pill">
            <div className="dash-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="dash-user-info">
              <span className="dash-user-name">{user?.name}</span>
              <span className="dash-user-role">{user?.role}</span>
            </div>
          </div>
          <button className="dash-logout-btn" onClick={handleLogout}>
            ⎋ Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="dash-main">
        <header className="dash-topbar">
          <button className="dash-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="dash-topbar-right">
            <span className="dash-greeting">Hello, {user?.name?.split(" ")[0]}</span>
          </div>
        </header>
        <div className="dash-content">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;