import React from "react";
import Button from "../common/Button";
import { EXPERIENCE_LEVELS, AVAILABILITY_OPTIONS, DIVERSITY_CATEGORIES } from "../../utils/constants";

const ProfileForm = ({ form, onChange, onSubmit, loading }) => {
  const input = { background:"var(--clr-surface-2)",border:"1px solid var(--clr-border)",borderRadius:"var(--radius-sm)",color:"var(--clr-text)",padding:"9px 12px",fontSize:"0.9rem",width:"100%",fontFamily:"var(--font-body)" };
  const field = { display:"flex",flexDirection:"column",gap:5 };
  const label = { fontSize:"0.82rem",fontWeight:600,color:"var(--clr-text-2)" };

  return (
    <form onSubmit={onSubmit} style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={field}><label style={label}>Bio</label><textarea rows={3} name="bio" value={form.bio||""} onChange={onChange} placeholder="Brief intro..." style={{...input,resize:"vertical"}} /></div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <div style={field}><label style={label}>Experience Level</label>
          <select name="experienceLevel" value={form.experienceLevel||"fresher"} onChange={onChange} style={input}>
            {EXPERIENCE_LEVELS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={field}><label style={label}>Availability</label>
          <select name="availability" value={form.availability||"immediate"} onChange={onChange} style={input}>
            {AVAILABILITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={field}><label style={label}>Diversity Category</label>
          <select name="diversityCategory" value={form.diversityCategory||"General"} onChange={onChange} style={input}>
            {DIVERSITY_CATEGORIES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={field}><label style={label}>Current Location</label><input name="currentLocation" value={form.currentLocation||""} onChange={onChange} placeholder="Mumbai" style={input} /></div>
        <div style={field}><label style={label}>LinkedIn</label><input name="linkedIn" value={form.linkedIn||""} onChange={onChange} placeholder="https://linkedin.com/in/..." style={input} /></div>
        <div style={field}><label style={label}>GitHub</label><input name="github" value={form.github||""} onChange={onChange} placeholder="https://github.com/..." style={input} /></div>
      </div>
      <Button type="submit" variant="primary" loading={loading}>Save Profile</Button>
    </form>
  );
};

export default ProfileForm;
