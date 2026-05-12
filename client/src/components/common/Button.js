import React from "react";
import "./Button.css";

const Button = ({
  children, onClick, type = "button", variant = "primary",
  size = "md", disabled = false, loading = false, fullWidth = false,
  className = ""
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`btn btn-${variant} btn-${size} ${fullWidth ? "btn-full" : ""} ${loading ? "btn-loading" : ""} ${className}`}
  >
    {loading ? <span className="btn-spinner" /> : null}
    {children}
  </button>
);

export default Button;
