/** Shared form primitives carrying the brand focus treatment, so input
 * styling can't drift per-component again. */

export const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm " +
  "focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue";

export const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
