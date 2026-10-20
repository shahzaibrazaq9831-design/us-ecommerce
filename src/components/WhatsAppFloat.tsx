import { siteConfig } from "@/data/site";

export default function WhatsAppFloat() {
  return (
    <a
      href={siteConfig.whatsapp}
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
    >
      <i className="fab fa-whatsapp" />
    </a>
  );
}
