import { siteConfig } from "@/data/site";

/**
 * Two identical halves make the marquee loop seamlessly: the track is
 * translated by -50%, which lands the cloned half exactly where the first
 * half started.
 *
 * Both desktop groups render the same messages on purpose. Different copy in
 * each half makes the two halves different widths, so the -50% translation
 * no longer lines up and the bar visibly jumps every loop.
 */
function DesktopGroup({ hidden }: { hidden?: boolean }) {
  return (
    <div
      className="announcement-group announcement-group--desktop"
      aria-hidden={hidden || undefined}
    >
      <span>Free Worldwide Delivery on All Orders</span>
      <span className="announcement-separator"></span>
      <span>Free Shipping Worldwide within 2 weeks</span>
      <span className="announcement-separator"></span>
      <span>Buy 2 Dresses Get Extra 10% Off</span>
      <span className="announcement-separator"></span>
      <span>
        Use Code <strong>{siteConfig.promoCode}</strong> for{" "}
        {siteConfig.promoDiscount} Off First Prepaid Order
      </span>
      <span className="announcement-separator"></span>
      <span>7-Day Returns | Made-to-Order Stitching Available</span>
      <span className="announcement-separator"></span>
    </div>
  );
}

/** Shorter message set used below 1024px (second copy is the marquee clone). */
function MobileGroup({ hidden }: { hidden?: boolean }) {
  return (
    <div className="announcement-group" aria-hidden={hidden || undefined}>
      <span className="announcement-item">
        Shipped: 10% discount at checkout
      </span>
      <span className="announcement-separator announcement-separator--mid"></span>
      <span className="announcement-item">Free worldwide shipping </span>
      <span className="announcement-separator"></span>
    </div>
  );
}

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      {/* Desktop message set */}
      <div className="announcement-track announcement-track--desktop">
        <DesktopGroup />
        <DesktopGroup hidden />
      </div>

      {/* Mobile message set */}
      <div className="announcement-track announcement-track--mobile">
        <MobileGroup />
        <MobileGroup hidden />
      </div>
    </div>
  );
}
