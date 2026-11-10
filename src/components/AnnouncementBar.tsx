import { siteConfig } from "@/data/site";

/**
 * Single-line announcement marquee moving right to left.
 * Two identical groups make the loop seamless: the track translates by -50%,
 * which lands the clone exactly where the first group started.
 */
function AnnouncementGroup({ hidden }: { hidden?: boolean }) {
  return (
    <div className="announcement-group" aria-hidden={hidden || undefined}>
      <span>Free Worldwide Delivery on All Orders</span>
      <span className="announcement-separator" aria-hidden="true">•</span>
      <span>
        Use Code <strong>{siteConfig.promoCode}</strong> for{" "}
        {siteConfig.promoDiscount} Off
      </span>
      <span className="announcement-separator" aria-hidden="true">•</span>
      <span>Buy 2 Dresses Get Extra 10% Off</span>
      <span className="announcement-separator" aria-hidden="true">•</span>
      <span>7-Day Returns | Made-to-Order Stitching Available</span>
      <span className="announcement-separator" aria-hidden="true">•</span>
    </div>
  );
}

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <div className="announcement-track">
        <AnnouncementGroup />
        <AnnouncementGroup hidden />
      </div>
    </div>
  );
}
