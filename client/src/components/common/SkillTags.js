import React from "react";
import "./SkillTags.css";

const SkillTags = ({ skills = [], max = 999, variant = "default", size = "sm" }) => {
  const visible = skills.slice(0, max);
  const hidden  = skills.length - visible.length;
  return (
    <div className="skill-tags">
      {visible.map((skill) => (
        <span key={skill} className={`skill-tag skill-tag-${variant} skill-tag-${size}`}>{skill}</span>
      ))}
      {hidden > 0 && <span className="skill-tag skill-tag-more">+{hidden}</span>}
    </div>
  );
};

export default SkillTags;
