/**
 * Single-line announcement marquee moving right to left.
 * Two identical groups make the loop seamless: the track translates by -50%,
 * which lands the clone exactly where the first group started.
 */
function AnnouncementGroup({ hidden }: { hidden?: boolean }) {
  return (
    <div
      className="announcement-group flex min-w-[100vw] flex-none items-center justify-around gap-[28px] px-[28px] whitespace-nowrap"
      aria-hidden={hidden || undefined}
    >
      <span>Free Worldwide Delivery on All Orders</span>
      <span className="opacity-50" aria-hidden="true"></span>
      {/* <span className="opacity-50" aria-hidden="true"></span> */}
      {/* <span>Buy 2 Dresses Get Extra 10% Off</span> */}
      <span>7-Day Returns | Made-to-Order Stitching Available</span>
      <span className="opacity-50" aria-hidden="true"></span>
    </div>
  );
}

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar relative flex h-[var(--announcement-height)] items-center justify-start overflow-hidden bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))] text-white">
      <div className="announcement-track flex w-max flex-none animate-marquee items-center whitespace-nowrap text-[0.85rem] tracking-[0.5px] will-change-transform [backface-visibility:hidden] [transform:translate3d(0,0,0)]">
        <AnnouncementGroup />
        <AnnouncementGroup hidden />
      </div>
    </div>
  );
}
