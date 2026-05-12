import React from "react";
import "./StatusTracker.css";

const STEPS = ["pending","reviewed","shortlisted","accepted","completed"];
const STEP_LABEL = {
  pending:     "Applied",
  reviewed:    "Reviewed",
  shortlisted: "Shortlisted",
  accepted:    "Accepted",
  completed:   "Completed",
};
const STEP_ICON = {
  pending:     "📤",
  reviewed:    "👁",
  shortlisted: "⭐",
  accepted:    "✅",
  completed:   "🏆",
};

const StatusTracker = ({ status, timeline = [] }) => {
  const isRejected  = status === "rejected";
  const isWithdrawn = status === "withdrawn";
  const isStopped   = isRejected || isWithdrawn;

  // Find current step index
  const currentIdx = isStopped
    ? STEPS.indexOf("reviewed")
    : STEPS.indexOf(status) !== -1
      ? STEPS.indexOf(status)
      : 0;

  return (
    <div className="st-wrap">
      <div className="st-title">Application Status</div>

      {/* Step track */}
      <div className="st-track">
        {STEPS.map((step, i) => {
          const isDone    = i < currentIdx;
          const isCurrent = i === currentIdx && !isStopped;
          const isFuture  = i > currentIdx || isStopped;

          return (
            <React.Fragment key={step}>
              {/* Step dot */}
              <div className={`st-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""} ${isFuture && !isStopped ? "future" : ""}`}>
                <div className="st-dot">
                  {isDone   ? "✓" : STEP_ICON[step]}
                </div>
                <span className="st-label">{STEP_LABEL[step]}</span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className={`st-line ${i < currentIdx ? "done" : ""}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Rejected / Withdrawn banner */}
      {isStopped && (
        <div className={`st-stopped ${isRejected ? "rejected" : "withdrawn"}`}>
          {isRejected  ? "✕ Application was not selected this time. Keep applying!" : "○ You withdrew this application."}
        </div>
      )}

      {/* Timeline events */}
      {timeline.length > 0 && (
        <div className="st-timeline">
          <div className="st-tl-title">Activity Log</div>
          {[...timeline].reverse().map((event, i) => (
            <div key={i} className="st-tl-row">
              <div className="st-tl-dot" />
              <div className="st-tl-content">
                <span className="st-tl-msg">{event.message}</span>
                <span className="st-tl-time">
                  {new Date(event.timestamp).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusTracker;