import React from "react";

const Footer = () => (
  <footer style={{ background: "var(--clr-surface)", borderTop: "1px solid var(--clr-border)", padding: "24px 32px", textAlign: "center", color: "var(--clr-text-3)", fontSize: "0.82rem" }}>
    <p>© {new Date().getFullYear()} InternMatch AI — Powered by Gemini AI · Built with ❤️ in India</p>
  </footer>
);

export default Footer;
