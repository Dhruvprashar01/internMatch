import React, { useEffect, useState } from "react";
import { getDiversityStats } from "../../services/adminService";
import Card, { CardHeader } from "../../components/common/Card";
import Spinner from "../../components/common/Spinner";

const CATEGORY_COLORS = { General: "var(--clr-text-3)", SC: "var(--clr-primary)", ST: "var(--clr-accent)", OBC: "#60A5FA", PWD: "#A78BFA", EWS: "#F472B6" };

const DiversityReport = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDiversityStats().then(({ data }) => setStats(data.data))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const breakdown = stats?.diversityBreakdown || [];
  const total = breakdown.reduce((s, { count }) => s + count, 0) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeUp 0.4s ease" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800 }}>Diversity Report</h1>
        <p style={{ color: "var(--clr-text-2)", marginTop: 4 }}>Representation breakdown across all registered candidates</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <CardHeader title="Category Breakdown" subtitle={`${total} total candidates`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {breakdown.map(({ _id, count }) => {
              const pct = ((count / total) * 100).toFixed(1);
              const color = CATEGORY_COLORS[_id] || "var(--clr-text-3)";
              return (
                <div key={_id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{_id}</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--clr-text-2)" }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: "var(--clr-border)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 1s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Fairness Boost Applied" subtitle="Score boosts by category" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["SC", "+5 pts"], ["ST", "+7 pts"], ["OBC", "+3 pts"], ["PWD", "+8 pts"], ["EWS", "+4 pts"], ["General", "0 pts"]].map(([cat, boost]) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--clr-surface-2)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: CATEGORY_COLORS[cat] }} />
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{cat}</span>
                </div>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: CATEGORY_COLORS[cat] }}>{boost}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Platform Fairness Policy" />
        <div style={{ color: "var(--clr-text-2)", fontSize: "0.9rem", lineHeight: 1.7 }}>
          <p>InternMatch AI uses a <strong style={{ color: "var(--clr-text)" }}>transparency-first fairness model</strong>. After merit-based scoring, a small boost is applied to candidates from underrepresented categories (SC, ST, OBC, PWD, EWS) to counteract systemic disadvantages.</p>
          <p style={{ marginTop: 10 }}>All boosts are disclosed in the recommendation explanation. The matching score is clearly labeled with and without the fairness adjustment. The maximum boost (PWD, +8 pts) represents &lt;10% of the total score range, ensuring merit remains the primary driver.</p>
        </div>
      </Card>
    </div>
  );
};

export default DiversityReport;
