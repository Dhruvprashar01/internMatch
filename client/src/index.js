import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// ── Error Boundary: shows the actual crash message instead of blank screen ──
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", background: "#0A0F1E", color: "#F0F4FF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "monospace", padding: "40px"
        }}>
          <div style={{ maxWidth: 700 }}>
            <div style={{ color: "#EF4444", fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>
              ⚠ App Crashed
            </div>
            <div style={{ background: "#111827", border: "1px solid #1E2D45", borderRadius: 8, padding: 20 }}>
              <div style={{ color: "#F59E0B", marginBottom: 8, fontSize: "0.9rem" }}>Error:</div>
              <pre style={{ color: "#EF4444", whiteSpace: "pre-wrap", fontSize: "0.85rem", margin: 0 }}>
                {this.state.error?.message}
              </pre>
              {this.state.error?.stack && (
                <>
                  <div style={{ color: "#8899B4", marginTop: 16, marginBottom: 8, fontSize: "0.85rem" }}>Stack trace:</div>
                  <pre style={{ color: "#4A6080", whiteSpace: "pre-wrap", fontSize: "0.78rem", margin: 0 }}>
                    {this.state.error.stack}
                  </pre>
                </>
              )}
            </div>
            <div style={{ marginTop: 16, color: "#8899B4", fontSize: "0.85rem" }}>
              Check the browser Console tab for more details.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);