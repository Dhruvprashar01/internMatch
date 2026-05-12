import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getRoadmap } from "../../services/candidateService";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import "./Roadmap.css";

const TYPE_ICON = { video:"▶", article:"📄", project:"🛠", practice:"⚡", course:"🎓" };
const TYPE_COLOR= { video:"#60A5FA", article:"#A78BFA", project:"#10B981", practice:"#F59E0B", course:"#00D4C8" };

// Score progress bar
const ScoreProgress = ({ current, target }) => {
  const color = current >= 70 ? "#10B981" : current >= 50 ? "#00D4C8" : "#F59E0B";
  return (
    <div className="rm-score-bar-wrap">
      <div className="rm-score-bar-track">
        <div className="rm-score-bar-current" style={{ width: `${current}%`, background: color }} />
        <div className="rm-score-bar-target" style={{ left: `${target}%` }} />
      </div>
      <div className="rm-score-labels">
        <span style={{ color }}>Now: {current}%</span>
        <span style={{ color:"var(--clr-primary)" }}>Target: {target}%</span>
      </div>
    </div>
  );
};

// Week card
const WeekCard = ({ week, index }) => {
  const [open, setOpen] = useState(index === 0); // first week open by default
  return (
    <div className="rm-week-card">
      <button className="rm-week-header" onClick={() => setOpen(!open)}>
        <div className="rm-week-badge">Week {week.week}</div>
        <div className="rm-week-info">
          <span className="rm-week-theme">{week.theme}</span>
          <span className="rm-week-goal">{week.goal}</span>
        </div>
        <span className="rm-week-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="rm-week-body">
          {/* Tasks */}
          <div className="rm-tasks">
            {(week.tasks || []).map((task, i) => (
              <div key={i} className="rm-task">
                <div className="rm-task-type" style={{ background: (TYPE_COLOR[task.type] || "#888") + "20", color: TYPE_COLOR[task.type] || "#888" }}>
                  {TYPE_ICON[task.type] || "📌"} {task.type}
                </div>
                <div className="rm-task-body">
                  <div className="rm-task-title">{task.title}</div>
                  <p className="rm-task-desc">{task.description}</p>
                  <div className="rm-task-footer">
                    <span className="rm-task-duration">⏱ {task.duration}</span>
                    {task.resourceUrl ? (
                      <a href={task.resourceUrl} target="_blank" rel="noreferrer" className="rm-task-link">
                        {task.resource} →
                      </a>
                    ) : (
                      <span className="rm-task-resource">📚 {task.resource}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Milestone */}
          <div className="rm-milestone">
            <span className="rm-milestone-icon">🏁</span>
            <div>
              <span className="rm-milestone-label">Week {week.week} Milestone</span>
              <p className="rm-milestone-text">{week.milestone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Roadmap = () => {
  const { internshipId } = useParams();
  const location = useLocation();
  const internshipTitle = location.state?.title || "Internship";

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getRoadmap(internshipId)
      .then(({ data: res }) => setData(res.data))
      .catch((e) => setError(e.response?.data?.message || "Could not generate roadmap"))
      .finally(() => setLoading(false));
  }, [internshipId]);

  if (loading) return (
    <div className="rm-loading">
      <Spinner label="Gemini AI is building your personalized roadmap..." />
      <p className="rm-loading-sub">Analyzing your skills vs job requirements...</p>
    </div>
  );

  if (error) return (
    <div className="rm-error">
      <Alert type="error" message={error} duration={0} />
      <Link to="/candidate/recommendations"><Button variant="secondary">← Back to Recommendations</Button></Link>
    </div>
  );

  const { internship, roadmap } = data || {};
  const LEVEL_COLOR = { "Job Ready":"#10B981", "Nearly Ready":"#00D4C8", "Developing":"#F59E0B", "Beginner":"#EF4444" };

  return (
    <div className="rm-page">
      {/* Header */}
      <div className="rm-header">
        <Link to="/candidate/recommendations" className="rm-back">← Back to Recommendations</Link>
        <div className="rm-header-badge">✦ AI Career Coach</div>
        <h1 className="rm-title">Your Readiness Roadmap</h1>
        <p className="rm-subtitle">
          Personalized plan to go from <strong>{roadmap?.currentScore}%</strong> to <strong>{roadmap?.targetScore}%+</strong> match for
          {" "}<strong>{internship?.title}</strong> at <strong>{internship?.company}</strong>
        </p>
      </div>

      {/* Stats row */}
      <div className="rm-stats">
        <div className="rm-stat-card">
          <span className="rm-stat-icon">🎯</span>
          <div className="rm-stat-value">{roadmap?.currentScore}%</div>
          <div className="rm-stat-label">Current Match</div>
        </div>
        <div className="rm-stat-card rm-stat-card-target">
          <span className="rm-stat-icon">🚀</span>
          <div className="rm-stat-value" style={{ color:"var(--clr-primary)" }}>{roadmap?.targetScore}%+</div>
          <div className="rm-stat-label">Target Match</div>
        </div>
        <div className="rm-stat-card">
          <span className="rm-stat-icon">📅</span>
          <div className="rm-stat-value">{roadmap?.weeksNeeded}</div>
          <div className="rm-stat-label">Weeks to Ready</div>
        </div>
        <div className="rm-stat-card">
          <span className="rm-stat-icon">⚡</span>
          <div className="rm-stat-value" style={{ color: LEVEL_COLOR[roadmap?.readinessLevel] || "var(--clr-text)" }}>
            {roadmap?.readinessLevel}
          </div>
          <div className="rm-stat-label">Readiness Level</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rm-card">
        <h3 className="rm-card-title">Match Score Progress</h3>
        <ScoreProgress current={roadmap?.currentScore || 0} target={roadmap?.targetScore || 85} />
      </div>

      {/* AI Summary */}
      <div className="rm-card rm-summary-card">
        <div className="rm-ai-badge">✦ Gemini AI Analysis</div>
        <p className="rm-summary">{roadmap?.summary}</p>
        {roadmap?.missingSkills?.length > 0 && (
          <div className="rm-missing-skills">
            <span className="rm-missing-label">Skills to learn:</span>
            <div className="rm-missing-chips">
              {roadmap.missingSkills.map((s) => (
                <span key={s} className="rm-chip">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Week-by-week plan */}
      <div className="rm-section">
        <h2 className="rm-section-title">📅 Your Week-by-Week Plan</h2>
        <div className="rm-weeks">
          {(roadmap?.weeks || []).map((week, i) => (
            <WeekCard key={week.week} week={week} index={i} />
          ))}
        </div>
      </div>

      {/* GitHub project idea */}
      {roadmap?.githubProjectIdea && (
        <div className="rm-card rm-github-card">
          <div className="rm-github-header">
            <span className="rm-github-icon">⚙</span>
            <h3>Capstone Project Idea</h3>
          </div>
          <p className="rm-github-desc">{roadmap.githubProjectIdea}</p>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="rm-github-btn">
            Push to GitHub →
          </a>
        </div>
      )}

      {/* Final tips */}
      {roadmap?.finalTips?.length > 0 && (
        <div className="rm-card">
          <h3 className="rm-card-title">💡 Pro Tips</h3>
          <div className="rm-tips">
            {roadmap.finalTips.map((tip, i) => (
              <div key={i} className="rm-tip">
                <span className="rm-tip-num">{i + 1}</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="rm-cta">
        <Link to={`/candidate/internship/${internshipId}`}>
          <Button variant="primary" size="lg">Apply to This Internship →</Button>
        </Link>
        <Link to="/candidate/recommendations">
          <Button variant="secondary" size="lg">View Other Recommendations</Button>
        </Link>
      </div>
    </div>
  );
};

export default Roadmap;