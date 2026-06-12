export const getAdminEmails = () => {
  return (process.env.ADMIN_WHITELIST || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

export const isAdminEmail = (email) => {
  if (!email) return false;

  return getAdminEmails().includes(email.trim().toLowerCase());
};