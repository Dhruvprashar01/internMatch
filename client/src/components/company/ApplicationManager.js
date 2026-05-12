import React from "react";
import CandidateCard from "./CandidateCard";
import Spinner from "../common/Spinner";

const ApplicationManager = ({ applications, loading, onStatusChange }) => {
  if (loading) return <Spinner label="Loading applicants…" />;
  if (!applications.length) return <div style={{ textAlign:"center",padding:32,color:"var(--clr-text-2)" }}>No applicants yet</div>;
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
      {applications.map((app, idx) => (
        <CandidateCard key={app._id} application={app} rank={idx+1} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
};

export default ApplicationManager;
