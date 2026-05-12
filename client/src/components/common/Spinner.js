import React from "react";
import "./Spinner.css";

const Spinner = ({ size = "md", fullScreen = false, label = "Loading..." }) => {
  const spinner = (
    <div className={`spinner spinner-${size}`}>
      <div className="spinner-ring" />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
  if (fullScreen) return <div className="spinner-fullscreen">{spinner}</div>;
  return spinner;
};

export default Spinner;
