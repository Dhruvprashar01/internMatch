import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => (
  <nav className="navbar">
    <Link to="/" className="navbar-brand">
      <div className="navbar-logo-mark">IM</div>
      <span>InternMatch AI</span>
    </Link>
    <div className="navbar-links">
      <Link to="/login" className="navbar-link">Sign In</Link>
      <Link to="/register" className="navbar-cta">Get Started</Link>
    </div>
  </nav>
);

export default Navbar;
