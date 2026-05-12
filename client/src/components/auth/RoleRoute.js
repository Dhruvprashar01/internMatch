import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";

const RoleRoute = ({ role }) => {
  const { user } = useAuth();
  if (user?.role !== role) return <Navigate to={`/${user?.role || "login"}`} replace />;
  return <DashboardLayout><Outlet /></DashboardLayout>;
};

export default RoleRoute;
