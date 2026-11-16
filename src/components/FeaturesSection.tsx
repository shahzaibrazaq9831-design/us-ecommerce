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
    <section
      className="bg-cream py-[20px] [border-bottom:1px_solid_var(--color-gray-200)] sm:py-[32px] md:py-[48px]"
      aria-label="Why shop with us"
    >
      <div className="container">
        <ul className="m-0 grid list-none grid-cols-2 gap-x-[16px] gap-y-[20px] p-0 md:grid-cols-4 md:gap-x-[24px] md:gap-y-[32px]">
          {features.map(({ title, description, href, icon }) => (
            <li key={title} className="min-w-0">
              <Link
                href={href}
                className="group flex h-full min-h-[56px] flex-col items-center gap-[10px] rounded-[var(--radius-lg)] p-[var(--spacing-sm)_var(--spacing-xs)] text-center [transition:background-color_var(--transition-fast)] hover:bg-white focus-visible:[outline:2px_solid_var(--color-feature-icon)] focus-visible:outline-offset-2"
              >
                <span className="inline-flex h-[36px] w-[36px] flex-none sm:h-[44px] sm:w-[44px]">
                  {/* Decorative: the heading next to it carries the meaning. */}
                  <Image
                    src={icon}
                    alt=""
                    aria-hidden="true"
                    width={44}
                    height={44}
                    sizes="(max-width: 639px) 36px, 44px"
                    className="h-full w-full object-contain"
                  />
                </span>
                <span className="min-w-0 text-center">
                  <span className="block text-[0.75rem] font-semibold leading-[1.375] text-secondary [transition:color_var(--transition-fast)] group-hover:text-feature-icon-hover group-focus-visible:text-feature-icon-hover sm:text-[0.875rem]">
                    {title}
                  </span>
                  <span className="mt-[4px] hidden max-w-[260px] text-[0.75rem] leading-[1.5] text-gray-600 sm:line-clamp-3">
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
