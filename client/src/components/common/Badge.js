import React from "react";
import "./Badge.css";

const Badge = ({ children, variant = "default", size = "sm" }) => (
  <span className={`badge badge-${variant} badge-${size}`}>{children}</span>
);

export default Badge;
