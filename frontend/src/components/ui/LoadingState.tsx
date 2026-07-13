/** Shared centered loading treatment for gate/resume/session checks. */
export default function LoadingState({ children = "Loading…" }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-brand-gray">
      {children}
    </div>
  );
}
