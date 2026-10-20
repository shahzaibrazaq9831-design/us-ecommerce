import { siteConfig } from "@/data/site";

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <div className="announcement-track">
        <span>Free Worldwide Delivery on All Orders</span>
        <span className="announcement-separator">•</span>
        <span>
          Use Code <strong>{siteConfig.promoCode}</strong> for {siteConfig.promoDiscount} Off First Prepaid Order
        </span>
        <span className="announcement-separator">•</span>
        <span>7-Day Returns | Made-to-Order Stitching Available</span>
        <span className="announcement-separator">•</span>
        <span>Free Worldwide Delivery on All Orders</span>
        <span className="announcement-separator">•</span>
        <span>
          Use Code <strong>{siteConfig.promoCode}</strong> for {siteConfig.promoDiscount} Off First Prepaid Order
        </span>
        <span className="announcement-separator">•</span>
        <span>7-Day Returns | Made-to-Order Stitching Available</span>
      </div>
    </div>
  );
}
