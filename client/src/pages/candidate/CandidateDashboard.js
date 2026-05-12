import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getProfile } from "../../services/candidateService";
import { getMyApplications } from "../../services/candidateService";
import Card, { CardHeader } from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import SkillTags from "../../components/common/SkillTags";
import "./CandidateDashboard.css";

const StatCard = ({ label, value, icon, color }) => (
  <div className="stat-card" style={{ borderTopColor: color }}>
    <span className="stat-icon">{icon}</span>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const CandidateDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, appRes] = await Promise.all([
          getProfile(),
          getMyApplications({ limit: 5 }),
        ]);
        setProfile(profRes.data.data);
        setApplications(appRes.data.data || []);
      } catch (e) {
        // profile may not exist yet
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner label="Loading dashboard..." />;

  const completion = profile?.profileCompletion ?? 0;

  return (
    <div className="cand-dash">
      {/* Hero */}
      <div className="cand-hero">
        <div>
          <h1 className="cand-hero-title">
            Good day, <span className="text-primary">{user?.name?.split(" ")[0]}</span> ✦
          </h1>
          <p className="cand-hero-sub">
            {profile?.skills?.length ? `You have ${profile.skills.length} skills on your profile.` : "Complete your profile to get AI-powered recommendations."}
          </p>
        </div>
        <div className="cand-hero-actions">
          <Link to="/candidate/recommendations">
            <Button variant="primary">✦ Get Recommendations</Button>
          </Link>
          <Link to="/candidate/profile">
            <Button variant="secondary">Edit Profile</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="cand-stats">
        <StatCard label="Profile Completion" value={`${completion}%`} icon="◎" color="var(--clr-primary)" />
        <StatCard label="Skills Listed"      value={profile?.skills?.length ?? 0} icon="✦" color="var(--clr-accent)" />
        <StatCard label="Applications Sent"  value={applications.length} icon="◈" color="var(--clr-success)" />
        <StatCard label="Experience Level"   value={profile?.experienceLevel ?? "fresher"} icon="⬡" color="#60A5FA" />
      </div>

      {/* Profile completion bar */}
      {completion < 100 && (
        <Card className="cand-completion-card" padding="md">
          <div className="cand-completion-header">
            <span className="cand-completion-label">Profile Completion — {completion}%</span>
            <Link to="/candidate/profile" className="cand-completion-link">Complete Now →</Link>
          </div>
          <div className="cand-progress-track">
            <div className="cand-progress-fill" style={{ width: `${completion}%` }} />
          </div>
          <div className="cand-completion-hints">
            {!profile?.resumeUrl      && <span className="cand-hint">Upload resume (+25%)</span>}
            {!profile?.skills?.length && <span className="cand-hint">Add skills (+20%)</span>}
            {!profile?.bio             && <span className="cand-hint">Write a bio (+10%)</span>}
          </div>
        </Card>
      )}

      {/* Two column grid */}
      <div className="cand-grid">
        {/* Recent Applications */}
        <Card>
          <CardHeader title="Recent Applications" subtitle="Your latest internship applications" action={<Link to="/candidate/applications"><Button variant="ghost" size="sm">View All</Button></Link>} />
          {applications.length === 0 ? (
            <div className="cand-empty">
              <p>No applications yet.</p>
              <Link to="/candidate/recommendations"><Button variant="outline" size="sm">Browse Recommendations</Button></Link>
            </div>
          ) : (
            <div className="cand-app-list">
              {applications.map((app) => (
                <div key={app._id} className="cand-app-row">
                  <div className="cand-app-info">
                    <span className="cand-app-title">{app.internship?.title}</span>
                    <span className="cand-app-company">{app.internship?.company?.companyName}</span>
                  </div>
                  <div className="cand-app-right">
                    <Badge variant={
                      app.status === "accepted" ? "success" :
                      app.status === "rejected" ? "danger" :
                      app.status === "shortlisted" ? "warning" : "default"
                    }>{app.status}</Badge>
                    <span className="cand-app-score">{app.matchScore}% match</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Your Skills */}
        <Card>
          <CardHeader title="Your Skills" subtitle="Skills extracted from your profile" action={<Link to="/candidate/profile"><Button variant="ghost" size="sm">Edit</Button></Link>} />
          {profile?.skills?.length ? (
            <SkillTags skills={profile.skills} max={20} variant="primary" />
          ) : (
            <div className="cand-empty">
              <p>No skills added yet.</p>
              <Link to="/candidate/profile"><Button variant="outline" size="sm">Add Skills</Button></Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CandidateDashboard;
