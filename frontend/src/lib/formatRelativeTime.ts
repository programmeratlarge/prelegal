/** "just now" / "5 minutes ago" / "3 hours ago" / "2 days ago", from a
 * SQLite UTC timestamp ("YYYY-MM-DD HH:MM:SS", no timezone suffix). */
export function formatRelativeTime(sqliteUtc: string): string {
  const parsed = new Date(`${sqliteUtc.replace(" ", "T")}Z`);
  if (Number.isNaN(parsed.getTime())) return sqliteUtc;

  const seconds = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
