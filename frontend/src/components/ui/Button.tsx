const styles = {
  primary:
    "rounded-md bg-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-sm " +
    "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
  quiet: "text-sm font-medium text-brand-blue hover:underline disabled:opacity-60",
  danger: "text-sm font-medium text-red-600 hover:underline disabled:opacity-60",
} as const;

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof styles;
}) {
  return <button type="button" {...props} className={`${styles[variant]} ${className}`} />;
}
