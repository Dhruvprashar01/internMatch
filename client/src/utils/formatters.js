export const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatCurrency = (amount, currency = "INR") => {
  if (!amount) return "Unpaid";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
};

export const formatRelative = (date) => {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60)   return `${minutes}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24)     return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 30)      return `${days}d ago`;
  return formatDate(date);
};

export const truncate = (str, len = 120) => {
  if (!str) return "";
  return str.length <= len ? str : str.slice(0, len) + "…";
};

export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const scoreColor = (score) =>
  score >= 75 ? "var(--clr-primary)" :
  score >= 50 ? "var(--clr-accent)"  :
  score >= 30 ? "var(--clr-warning)" : "var(--clr-danger)";
