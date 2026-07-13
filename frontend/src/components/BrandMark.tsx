/**
 * The Prelegal wordmark: a section sign (§ — the law's own typographic
 * artifact) in brand yellow on a navy tile, beside the name.
 */
export default function BrandMark({ large = false }: { large?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className={`flex items-center justify-center rounded-md bg-brand-navy font-bold text-brand-yellow ${
          large ? "h-10 w-10 text-2xl" : "h-7 w-7 text-base"
        }`}
      >
        §
      </span>
      <span
        className={`font-bold tracking-tight text-brand-navy ${large ? "text-2xl" : "text-lg"}`}
      >
        Prelegal
      </span>
    </span>
  );
}
