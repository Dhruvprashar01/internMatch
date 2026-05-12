import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyInternships } from "../../services/internshipService";
import { getCompanyProfile } from "../../services/companyService";
import Card, { CardHeader } from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import "./CompanyDashboard.css";

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([getMyInternships({ limit: 5 }), getCompanyProfile()])
      .then(([intRes, profRes]) => {
        setInternships(intRes.data.data || []);
        setProfile(profRes.data.data);
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading dashboard..." />;

  const totalApps = internships.reduce((s, i) => s + (i.applicationCount || 0), 0);
  const activeInt = internships.filter((i) => i.status === "active").length;

  return (
    <div className="co-dash">
      <div className="co-hero">
        <div>
          <h1 className="co-hero-title">
            {profile?.companyName || user?.name} <span className="text-primary">⬡</span>
          </h1>
          <p className="co-hero-sub">{profile?.industry || "Technology"} · {profile?.headquarters || "India"}</p>
        </div>
        <div className="co-hero-actions">
          <Link to="/company/post-internship"><Button variant="primary">+ Post Internship</Button></Link>
          <Link to="/company/profile"><Button variant="secondary">Edit Profile</Button></Link>
        </div>
      </div>

      <div className="co-stats">
        {[
          { label: "Posted Internships", value: internships.length, icon: "◈", color: "var(--clr-primary)" },
          { label: "Active Listings",    value: activeInt,          icon: "⬡", color: "var(--clr-success)" },
          { label: "Total Applications", value: totalApps,          icon: "✦", color: "var(--clr-accent)" },
          { label: "Company Size",       value: profile?.size || "—", icon: "◎", color: "#60A5FA" },
        ].map((s) => (
          <div key={s.label} className="co-stat-card" style={{ borderTopColor: s.color }}>
            <span className="co-stat-icon">{s.icon}</span>
            <div>
              <div className="co-stat-value">{s.value}</div>
              <div className="co-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Your Internship Postings"
          subtitle="Manage and view applicants for all your listings"
          action={<Link to="/company/internships"><Button variant="ghost" size="sm">View All</Button></Link>}
        />
        {internships.length === 0 ? (
          <div className="co-empty">
            <p>No internships posted yet.</p>
            <Link to="/company/post-internship"><Button variant="primary" size="sm">Post Your First Internship</Button></Link>
          </div>
        ) : (
          <div className="co-int-table">
            <div className="co-int-head">
              <span>Title</span><span>Location</span><span>Applications</span><span>Status</span><span>Action</span>
            </div>
            {internships.map((int) => (
              <div key={int._id} className="co-int-row">
                <div>
                  <div className="co-int-title">{int.title}</div>
                  <div className="co-int-duration">{int.duration}</div>
                </div>
                <span className="co-int-loc">📍 {int.location}</span>
                <span className="co-int-apps">{int.applicationCount || 0} applicants</span>
                <Badge variant={int.status === "active" ? "success" : "default"}>{int.status}</Badge>
                <Link to={`/company/applicants/${int._id}`}>
                  <Button variant="outline" size="sm">View Applicants</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CompanyDashboard;
