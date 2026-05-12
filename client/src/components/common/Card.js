import React from "react";
import "./Card.css";

const Card = ({ children, className = "", glow = false, onClick, padding = "lg" }) => (
  <div
    className={`card card-pad-${padding} ${glow ? "card-glow" : ""} ${onClick ? "card-clickable" : ""} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action }) => (
  <div className="card-header">
    <div>
      <h3 className="card-title">{title}</h3>
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
    </div>
    {action && <div className="card-action">{action}</div>}
  </div>
);

export default Card;
