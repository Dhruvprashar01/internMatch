import React, { useEffect, useState } from "react";
import { getPlatformStats } from "../../services/adminService";
import Card, { CardHeader } from "../../components/common/Card";
import Spinner from "../../components/common/Spinner";

const PlatformStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getPlatformStats().then(({ data }) => setStats(data.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <Spinner />;
  const ov = stats?.overview || {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeUp 0.4s ease" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800 }}>Platform Statistics</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {Object.entries(ov).map(([key, val]) => (
          <Card key={key} padding="md">
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 800, color: "var(--clr-primary)", lineHeight: 1 }}>{val ?? "—"}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--clr-text-2)", marginTop: 6, textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</div>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader title="Applications by Status" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(stats?.applicationsByStatus || []).map(({ _id, count }) => (
            <div key={_id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 100, fontSize: "0.85rem", textTransform: "capitalize", color: "var(--clr-text-2)" }}>{_id}</span>
              <div style={{ flex: 1, height: 8, background: "var(--clr-border)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min((count / (ov.totalApplications || 1)) * 100, 100)}%`, background: "var(--clr-primary)", borderRadius: 4, transition: "width 0.8s ease" }} />
              </div>
              <span style={{ width: 32, textAlign: "right", fontSize: "0.82rem", color: "var(--clr-text-2)" }}>{count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PlatformStats;
