/** App-wide disclaimer footer, mounted once in the root layout. */
export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-brand-gray">
      Prelegal generates draft documents only. All drafts are subject to review by qualified
      legal counsel before use.
    </footer>
  );
}
