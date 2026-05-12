import React, { useState } from "react";
import Button from "../common/Button";
import { EXPERIENCE_LEVELS } from "../../utils/constants";

const InternshipForm = ({ onSubmit, loading, initial = {} }) => {
  const [form, setForm] = useState({ title:"",description:"",location:"",duration:"",stipend:0,openings:1,isRemote:false,experienceRequired:"fresher",educationRequired:"",applicationDeadline:"", ...initial });
  const [reqSkills, setReqSkills] = useState(initial.requiredSkills||[]);
  const [prefSkills, setPrefSkills] = useState(initial.preferredSkills||[]);
  const [si, setSi] = useState(""); const [pi, setPi] = useState("");
  const input = { background:"var(--clr-surface-2)",border:"1px solid var(--clr-border)",borderRadius:"var(--radius-sm)",color:"var(--clr-text)",padding:"9px 12px",fontSize:"0.9rem",width:"100%",fontFamily:"var(--font-body)" };

  const submit = (e) => { e.preventDefault(); onSubmit({ ...form, requiredSkills:reqSkills, preferredSkills:prefSkills }); };

  return (
    <form onSubmit={submit} style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)",display:"block",marginBottom:5 }}>Title *</label><input required value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} placeholder="Full Stack Developer Intern" style={input} /></div>
        <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)",display:"block",marginBottom:5 }}>Description *</label><textarea required rows={4} value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} placeholder="Describe the role…" style={{...input,resize:"vertical"}} /></div>
        <div><label style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)",display:"block",marginBottom:5 }}>Location *</label><input required value={form.location} onChange={(e) => setForm({...form,location:e.target.value})} style={input} /></div>
        <div><label style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)",display:"block",marginBottom:5 }}>Duration *</label><input required value={form.duration} onChange={(e) => setForm({...form,duration:e.target.value})} placeholder="2 months" style={input} /></div>
        <div><label style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)",display:"block",marginBottom:5 }}>Stipend (₹/mo)</label><input type="number" min={0} value={form.stipend} onChange={(e) => setForm({...form,stipend:e.target.value})} style={input} /></div>
        <div><label style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)",display:"block",marginBottom:5 }}>Openings</label><input type="number" min={1} value={form.openings} onChange={(e) => setForm({...form,openings:e.target.value})} style={input} /></div>
        <div><label style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)",display:"block",marginBottom:5 }}>Experience Required</label><select value={form.experienceRequired} onChange={(e) => setForm({...form,experienceRequired:e.target.value})} style={{...input,appearance:"none"}}>{EXPERIENCE_LEVELS.map((o)=><option key={o}>{o}</option>)}</select></div>
        <div><label style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)",display:"block",marginBottom:5 }}>Education Required</label><input value={form.educationRequired} onChange={(e) => setForm({...form,educationRequired:e.target.value})} placeholder="B.Tech / Any Graduate" style={input} /></div>
      </div>
      <label style={{ display:"flex",alignItems:"center",gap:8,fontSize:"0.88rem",color:"var(--clr-text-2)",cursor:"pointer" }}>
        <input type="checkbox" checked={form.isRemote} onChange={(e) => setForm({...form,isRemote:e.target.checked})} style={{ accentColor:"var(--clr-primary)",width:16,height:16 }} /> Remote position
      </label>
      <div>
        <p style={{ fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)",marginBottom:8 }}>Required Skills *</p>
        <div style={{ display:"flex",gap:8,marginBottom:8 }}><input value={si} onChange={(e) => setSi(e.target.value)} onKeyDown={(e) => e.key==="Enter"&&(e.preventDefault(),si.trim()&&setReqSkills(p=>[...new Set([...p,si.trim()])]),setSi(""))} placeholder="Add skill…" style={{...input,flex:1}} /><Button type="button" variant="outline" size="sm" onClick={() => {if(si.trim())setReqSkills(p=>[...new Set([...p,si.trim()])]);setSi("");}}>Add</Button></div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{reqSkills.map((s)=><span key={s} style={{ display:"flex",alignItems:"center",gap:5,background:"var(--clr-primary-dim)",border:"1px solid rgba(0,212,200,0.3)",color:"var(--clr-primary)",borderRadius:999,padding:"3px 10px",fontSize:"0.78rem",fontWeight:600 }}>{s}<button type="button" onClick={()=>setReqSkills(p=>p.filter(x=>x!==s))} style={{ color:"inherit",opacity:0.7,fontSize:"0.7rem",background:"none",border:"none",cursor:"pointer" }}>✕</button></span>)}</div>
      </div>
      <Button type="submit" variant="primary" loading={loading} fullWidth>Post Internship</Button>
    </form>
  );
};

export default InternshipForm;
