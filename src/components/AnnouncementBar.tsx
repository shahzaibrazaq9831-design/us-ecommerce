import { ANNOUNCEMENT_TEXT } from "@/lib/offers";

/**
 * Single-line announcement marquee moving right to left.
 * Two identical groups make the loop seamless: the track translates by -50%,
 * which lands the clone exactly where the first group started.
 */
function AnnouncementGroup({
  items,
  hidden,
}: {
  items: string[];
  hidden?: boolean;
}) {
  return (
    <div
      className="announcement-group flex min-w-[100vw] flex-none items-center justify-around gap-[28px] px-[28px] whitespace-nowrap"
      aria-hidden={hidden || undefined}
    >
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className={index % 2 === 1 ? "opacity-50" : undefined}>
          {item}
        </span>
      ))}
    </div>
  );
}

export default function AnnouncementBar({
  text = ANNOUNCEMENT_TEXT,
}: {
  text?: string;
}) {
  const items = text
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="announcement-bar relative flex h-[var(--announcement-height)] items-center justify-start overflow-hidden bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))] text-white">
      <div className="announcement-track flex w-max flex-none animate-marquee items-center whitespace-nowrap text-[0.85rem] tracking-[0.5px] will-change-transform [backface-visibility:hidden] [transform:translate3d(0,0,0)]">
        <AnnouncementGroup items={items} />
        <AnnouncementGroup items={items} hidden />
      </div>
    </div>
  );
}
