import React from "react";
import CandidateCard from "./CandidateCard";

const MatchedCandidates = ({ applications = [], onStatusChange }) => (
  <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
    {applications.slice(0,5).map((app, idx) => (
      <CandidateCard key={app._id} application={app} rank={idx+1} onStatusChange={onStatusChange} />
    ))}
  </div>
);

export default MatchedCandidates;
