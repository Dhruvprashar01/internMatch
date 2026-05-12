export const APP_NAME = "InternMatch AI";

export const ROLES = { CANDIDATE: "candidate", COMPANY: "company", ADMIN: "admin" };

export const APPLICATION_STATUS = {
  PENDING: "pending", REVIEWED: "reviewed", SHORTLISTED: "shortlisted",
  ACCEPTED: "accepted", REJECTED: "rejected", WITHDRAWN: "withdrawn",
};

export const INTERNSHIP_STATUS = { ACTIVE: "active", CLOSED: "closed", DRAFT: "draft" };

export const EXPERIENCE_LEVELS = ["fresher", "0-1 years", "1-2 years", "2+ years"];
export const AVAILABILITY_OPTIONS = ["immediate", "1 month", "2 months", "3 months"];
export const DIVERSITY_CATEGORIES = ["General", "SC", "ST", "OBC", "PWD", "EWS"];

export const STATUS_BADGE_VARIANT = {
  pending: "default", reviewed: "info", shortlisted: "warning",
  accepted: "success", rejected: "danger", withdrawn: "default",
  active: "success", closed: "default", draft: "warning",
};

export const MATCH_STRENGTH = {
  Excellent: "var(--clr-primary)",
  Good:      "var(--clr-success)",
  Fair:      "var(--clr-warning)",
  Weak:      "var(--clr-text-3)",
};
