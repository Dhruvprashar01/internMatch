import React, { useRef } from "react";
import "./FileUpload.css";

const FileUpload = ({ accept, onChange, loading, currentFile, label = "Upload File", hint = "Click or drag to upload" }) => {
  const ref = useRef();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onChange({ target: { files: [file] } });
  };
  return (
    <div
      className={`file-upload-zone ${loading ? "loading" : ""}`}
      onClick={() => !loading && ref.current.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input ref={ref} type="file" accept={accept} onChange={onChange} style={{ display: "none" }} />
      {loading ? (
        <div className="fu-loading">
          <div className="fu-spinner" />
          <span>Processing…</span>
        </div>
      ) : currentFile ? (
        <div className="fu-current">
          <span className="fu-icon">📄</span>
          <span className="fu-name">{currentFile}</span>
          <span className="fu-change">Click to change</span>
        </div>
      ) : (
        <div className="fu-empty">
          <span className="fu-icon">⬆</span>
          <span className="fu-label">{label}</span>
          <span className="fu-hint">{hint}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
