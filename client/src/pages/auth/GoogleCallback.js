/**
 * pages/auth/GoogleCallback.js
 * Handles the redirect from Google OAuth.
 * Google → backend → frontend/auth/google/success?token=...&role=...
 * This page reads the token from URL, saves it, and redirects to dashboard.
 */
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../../components/common/Spinner";

const GoogleCallback = () => {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    const role  = params.get("role");
    const error = params.get("error");

    if (error || !token) {
      navigate("/login?error=google_failed");
      return;
    }

    // Store token and update auth state
    loginWithToken(token).then(() => {
      navigate(`/${role || "candidate"}`);
    }).catch(() => {
      navigate("/login?error=google_failed");
    });
  }, [params, navigate, loginWithToken]);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--clr-bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      <Spinner label="Signing you in with Google..." />
    </div>
  );
};

export default GoogleCallback;