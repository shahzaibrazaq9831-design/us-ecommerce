import Image from "next/image";
import Link from "next/link";
import { features } from "@/data/features";

/**
 * "Why shop with us" feature bar shown under the hero.
 *
 * Matches the reference storefront: two cards per row on phones and four
 * from 768px up, thin gold-brown line icons, centred text, the whole card
 * clickable. The supporting copy is hidden below 640px so a pair of cards
 * still fits in one tidy row.
 */
export default function FeaturesSection() {
  return (
    <section className="features-section" aria-label="Why shop with us">
      <div className="container">
        <ul className="features-section-grid">
          {features.map(({ title, description, href, icon }) => (
            <li key={title} className="features-section-item">
              <Link href={href} className="feature-card">
                <span className="feature-card-icon">
                  {/* Decorative: the heading next to it carries the meaning. */}
                  <Image
                    src={icon}
                    alt=""
                    aria-hidden="true"
                    width={44}
                    height={44}
                    sizes="(max-width: 639px) 36px, 44px"
                    className="feature-card-icon-img"
                  />
                </span>
                <span className="feature-card-text">
                  <span className="feature-card-title">{title}</span>
                  <span className="feature-card-description">
                    {description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
