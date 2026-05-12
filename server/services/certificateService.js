/**
 * services/certificateService.js
 * Generates internship completion certificates as HTML (print-to-PDF friendly)
 * Uses a unique verifiable certificate ID
 */
"use strict";

const crypto = require("crypto");

/** Generate a unique certificate ID like IM-2024-A3F9B2 */
const generateCertId = () => {
  const year   = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `IM-${year}-${random}`;
};

/** Build the HTML certificate */
const buildCertificateHTML = (data) => {
  const {
    certificateId, candidateName, internshipTitle,
    companyName, duration, skills, issuedAt, verifyUrl,
  } = data;

  const dateStr  = new Date(issuedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const skillList = (skills || []).slice(0, 8).join("  •  ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Certificate — ${candidateName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:#f8f6f0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:40px 20px}
    .cert{background:#fff;width:100%;max-width:820px;padding:60px 70px;border:12px solid #0A0F1E;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
    .cert::before{content:'';position:absolute;inset:8px;border:2px solid #00D4C8;pointer-events:none}
    .header{text-align:center;margin-bottom:40px}
    .logo{font-size:13px;font-weight:700;letter-spacing:4px;color:#00D4C8;text-transform:uppercase;margin-bottom:8px}
    .cert-type{font-family:'Playfair Display',serif;font-size:38px;font-weight:700;color:#0A0F1E;line-height:1.1}
    .cert-sub{font-size:13px;color:#888;letter-spacing:2px;text-transform:uppercase;margin-top:6px}
    .divider{width:80px;height:3px;background:linear-gradient(90deg,#00D4C8,#F59E0B);margin:28px auto}
    .body{text-align:center;margin-bottom:36px}
    .presented{font-size:13px;color:#999;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}
    .candidate{font-family:'Playfair Display',serif;font-size:46px;font-weight:700;color:#0A0F1E;border-bottom:3px solid #00D4C8;display:inline-block;padding-bottom:6px;margin-bottom:24px}
    .desc{font-size:16px;color:#444;line-height:1.8;max-width:560px;margin:0 auto}
    .desc strong{color:#0A0F1E;font-weight:600}
    .skills-section{background:#f8fffe;border:1px solid #00D4C820;border-radius:8px;padding:16px 24px;margin:28px 0;text-align:center}
    .skills-label{font-size:11px;color:#00D4C8;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px}
    .skills-list{font-size:14px;color:#444;line-height:1.6}
    .footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;padding-top:24px;border-top:1px solid #eee}
    .sig-block{text-align:center;flex:1}
    .sig-line{width:140px;height:1px;background:#333;margin:0 auto 8px}
    .sig-name{font-size:13px;font-weight:600;color:#0A0F1E}
    .sig-role{font-size:11px;color:#999;margin-top:2px}
    .cert-id-block{text-align:center;flex:1}
    .cert-date{font-size:12px;color:#999;margin-bottom:8px}
    .cert-id{font-size:11px;font-weight:700;letter-spacing:2px;color:#00D4C8;background:#f0fffe;padding:6px 14px;border-radius:4px;display:inline-block}
    .verify{font-size:10px;color:#bbb;margin-top:6px}
    .seal{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#0A0F1E,#00D4C8);display:flex;flex-direction:column;align-items:center;justify-content:center;flex:0 0 80px}
    .seal-text{color:#fff;font-size:9px;font-weight:700;letter-spacing:1px;text-align:center;line-height:1.4}
    @media print{body{background:#fff;padding:0}@page{margin:0}.cert{box-shadow:none;border-width:8px}}
  </style>
</head>
<body>
  <div class="cert">
    <div class="header">
      <div class="logo">✦ InternMatch AI</div>
      <div class="cert-type">Certificate of Completion</div>
      <div class="cert-sub">Internship Programme</div>
      <div class="divider"></div>
    </div>

    <div class="body">
      <div class="presented">This certifies that</div>
      <div class="candidate">${candidateName}</div>
      <p class="desc">
        has successfully completed the internship as<br/>
        <strong>${internshipTitle}</strong><br/>
        at <strong>${companyName}</strong><br/>
        for a duration of <strong>${duration}</strong>
      </p>
      ${skillList ? `
      <div class="skills-section">
        <div class="skills-label">Skills Demonstrated</div>
        <div class="skills-list">${skillList}</div>
      </div>` : ""}
    </div>

    <div class="footer">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${companyName}</div>
        <div class="sig-role">Authorized Signatory</div>
      </div>

      <div class="seal">
        <div class="seal-text">VERIFIED<br/>✦<br/>INTERN<br/>MATCH</div>
      </div>

      <div class="cert-id-block">
        <div class="cert-date">Issued on ${dateStr}</div>
        <div class="cert-id">${certificateId}</div>
        <div class="verify">Verify at internmatch.ai/verify</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

module.exports = { generateCertId, buildCertificateHTML };