interface ListingHeaderProps {
  /** Small line above the title (the shelf name). */
  eyebrow?: string;
  title: string;
  /** One or two lines describing the shelf. */
  intro: string;
  /** How many pieces the shelf holds — counted from the catalogue. */
  count?: number;
}

/**
 * Shared header for the listing pages so every shelf looks the same and
 * says the same thing: what it is, and how many pieces are in it.
 */
export default function ListingHeader({
  eyebrow,
  title,
  intro,
  count,
}: ListingHeaderProps) {
  return (
    <div className="section-header listing-header">
      {eyebrow ? <span className="listing-eyebrow">{eyebrow}</span> : null}
      <h1 className="section-title">{title}</h1>
      <p className="section-subtitle">{intro}</p>
      {typeof count === "number" ? (
        <p className="listing-count">
          {count} {count === 1 ? "piece" : "pieces"}
        </p>
      ) : null}
    </div>
  );
}
