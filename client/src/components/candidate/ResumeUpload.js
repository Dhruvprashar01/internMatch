import React, { useState } from "react";
import { uploadResume } from "../../services/candidateService";
import FileUpload from "../common/FileUpload";
import Alert from "../common/Alert";

const ResumeUpload = ({ currentFile, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("resume", file);
    setLoading(true); setError(""); setSuccess("");
    try {
      const { data } = await uploadResume(fd);
      const filled = data.data?.autoFilled || {};
      setSuccess(`Parsed! Found ${filled.skills?.length||0} skills, ${filled.educationCount||0} education entries.`);
      if (onSuccess) onSuccess(filled);
    } catch (e) {
      setError(e.response?.data?.message || "Upload failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}
      <FileUpload
        accept=".pdf,.docx"
        onChange={handleUpload}
        loading={loading}
        currentFile={currentFile}
        label="Upload Resume (PDF/DOCX)"
        hint="AI will auto-fill your profile from the resume"
      />
    </div>
  );
};

export default ResumeUpload;
