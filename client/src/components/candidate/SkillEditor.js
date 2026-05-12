import React, { useState } from "react";
import Button from "../common/Button";

const SkillEditor = ({ skills = [], onChange }) => {
  const [input, setInput] = useState("");
  const add = () => {
    const s = input.trim();
    if (s && !skills.includes(s)) onChange([...skills, s]);
    setInput("");
  };
  const remove = (sk) => onChange(skills.filter((s) => s !== sk));
  return (
    <div>
      <div style={{ display:"flex",gap:8,marginBottom:10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key==="Enter"&&(e.preventDefault(),add())} placeholder="Type a skill and press Enter…"
          style={{ flex:1,background:"var(--clr-surface-2)",border:"1px solid var(--clr-border)",borderRadius:"var(--radius-sm)",color:"var(--clr-text)",padding:"9px 12px",fontSize:"0.9rem",fontFamily:"var(--font-body)" }} />
        <Button type="button" variant="outline" size="sm" onClick={add}>Add</Button>
      </div>
      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
        {skills.map((s) => (
          <div key={s} style={{ display:"flex",alignItems:"center",gap:5,background:"var(--clr-primary-dim)",border:"1px solid rgba(0,212,200,0.3)",color:"var(--clr-primary)",borderRadius:999,padding:"3px 10px",fontSize:"0.78rem",fontWeight:600 }}>
            {s}
            <button onClick={() => remove(s)} style={{ color:"inherit",opacity:0.7,fontSize:"0.7rem",background:"none",border:"none",cursor:"pointer" }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillEditor;
