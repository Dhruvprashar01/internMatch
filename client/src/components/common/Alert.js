import React, { useEffect, useState, useCallback } from "react";
import "./Alert.css";

const ICONS = { success: "✓", error: "✕", warning: "!", info: "i" };

const Alert = ({ type = "info", message, onClose, duration = 5000 }) => {
  const [visible, setVisible] = useState(false);
  const [fading,  setFading]  = useState(false);
  const [key,     setKey]     = useState(0); // forces progress bar to restart on new message

  const close = useCallback(() => {
    setVisible(false);
    setFading(false);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!message) { setVisible(false); return; }

    // Reset everything — new message gets fresh timer + progress bar
    setVisible(true);
    setFading(false);
    setKey((k) => k + 1); // remount progress bar so animation restarts

    if (duration === 0) return;

    const fadeTimer  = setTimeout(() => setFading(true), duration - 400);
    const closeTimer = setTimeout(() => close(), duration);

    return () => { clearTimeout(fadeTimer); clearTimeout(closeTimer); };
  }, [message, duration, close]);

  if (!message || !visible) return null;

  return (
    <div className={`alert alert-${type} ${fading ? "alert-fading" : ""}`}>
      <span className="alert-icon">{ICONS[type]}</span>
      <span className="alert-msg">{message}</span>
      {onClose && (
        <button className="alert-close" onClick={close}>✕</button>
      )}
      {duration > 0 && (
        <div
          key={key}
          className="alert-progress"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
};

export default Alert;