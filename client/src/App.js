import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";

import Login    from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import GoogleCallback from "./pages/auth/GoogleCallback";
import VerifyCertificate from "./pages/public/VerifyCertificate";

import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import CandidateProfile   from "./pages/candidate/CandidateProfile";
import Recommendations    from "./pages/candidate/Recommendations";
import MyApplications     from "./pages/candidate/MyApplications";
import InternshipDetails  from "./pages/candidate/InternshipDetails";
import Roadmap            from "./pages/candidate/Roadmap";

import CompanyDashboard   from "./pages/company/CompanyDashboard";
import CompanyProfile     from "./pages/company/CompanyProfile";
import PostInternship     from "./pages/company/PostInternship";
import ManageInternships  from "./pages/company/ManageInternships";
import ViewApplicants     from "./pages/company/ViewApplicants";

import AdminDashboard         from "./pages/admin/AdminDashboard";
import ManageUsers            from "./pages/admin/ManageUsers";
import ManageJobs             from "./pages/admin/ManageJobs";
import ManageApplications     from "./pages/admin/ManageApplications";
import DiversityReport        from "./pages/admin/DiversityReport";
import PlatformStats          from "./pages/admin/PlatformStats";
import VerificationRequests   from "./pages/admin/VerificationRequests";

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/"         element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google/success" element={<GoogleCallback />} />

        {/* Public certificate verify — no auth needed */}
        <Route path="/verify/:certId" element={<VerifyCertificate />} />

        {/* Candidate */}
        <Route path="/candidate" element={<ProtectedRoute><RoleRoute role="candidate" /></ProtectedRoute>}>
          <Route index element={<CandidateDashboard />} />
          <Route path="profile"               element={<CandidateProfile />} />
          <Route path="recommendations"       element={<Recommendations />} />
          <Route path="applications"          element={<MyApplications />} />
          <Route path="internship/:id"        element={<InternshipDetails />} />
          <Route path="roadmap/:internshipId" element={<Roadmap />} />
        </Route>

        {/* Company */}
        <Route path="/company" element={<ProtectedRoute><RoleRoute role="company" /></ProtectedRoute>}>
          <Route index element={<CompanyDashboard />} />
          <Route path="profile"                  element={<CompanyProfile />} />
          <Route path="post-internship"          element={<PostInternship />} />
          <Route path="internships"              element={<ManageInternships />} />
          <Route path="applicants/:internshipId" element={<ViewApplicants />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute><RoleRoute role="admin" /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users"         element={<ManageUsers />} />
          <Route path="jobs"          element={<ManageJobs />} />
          <Route path="applications"  element={<ManageApplications />} />
          <Route path="diversity"     element={<DiversityReport />} />
          <Route path="stats"         element={<PlatformStats />} />
          <Route path="verifications" element={<VerificationRequests />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;