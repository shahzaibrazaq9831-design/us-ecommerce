import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Size Chart | Premium Pakistani Dresses",
  description:
    "Find your perfect fit with our size chart for shirts, maxi gowns, lehenga cholis and trousers. All measurements in inches, from 2XS to 2XL.",
};

const measuringTips = [
  {
    icon: "fas fa-ruler-horizontal",
    title: "Chest / Bust",
    text: "Measure around the fullest part of your chest, keeping the tape level and comfortably relaxed.",
  },
  {
    icon: "fas fa-tape",
    title: "Waist",
    text: "Measure around your natural waistline — the narrowest point above your belly button.",
  },
  {
    icon: "fas fa-ruler-vertical",
    title: "Hips",
    text: "Stand with feet together and measure around the fullest part of your hips and seat.",
  },
];

export default function SizeChartPage() {
  return (
    <section className="section size-chart-section">
      <div className="container" style={{ maxWidth: "1100px" }}>
        {/* Page header — fades up on open */}
        <div className="section-header size-chart-fade-up delay-1">
          <span className="size-chart-kicker">Find Your Fit</span>
          <h1 className="section-title">Size Chart</h1>
          <p className="section-subtitle">
            All measurements are in inches. If you are between sizes, we recommend
            choosing the larger size or contacting us for made-to-order tailoring.
          </p>
        </div>

        {/* Size chart card — fades up on open with shadow */}
        <div className="size-chart-card size-chart-fade-up delay-2">
          <Image
            src="/images/sizechart.jfif"
            alt="Size chart for shirts, maxi gowns, lehenga cholis and trousers, from 2XS to 2XL, measurements in inches"
            width={1211}
            height={880}
            priority
            sizes="(max-width: 768px) 100vw, 1056px"
            className="size-chart-image"
          />
          <a
            href="/images/sizechart.jfif"
            target="_blank"
            rel="noopener noreferrer"
            className="size-chart-fullsize"
          >
            <i className="fas fa-expand-alt" aria-hidden="true" /> View full size
          </a>
        </div>

        {/* How to measure — fades up on open */}
        <div className="size-chart-tips size-chart-fade-up delay-3">
          {measuringTips.map((tip) => (
            <div key={tip.title} className="size-chart-tip">
              <div className="size-chart-tip-icon">
                <i className={tip.icon} aria-hidden="true" />
              </div>
              <div>
                <h2>{tip.title}</h2>
                <p>{tip.text}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="size-chart-note size-chart-fade-up delay-3">
          Need a custom fit?{" "}
          <Link href="/contact">Contact us</Link> and share your measurements — we
          tailor every outfit to your size at no extra cost.
        </p>
      </div>
    </section>
  );
}
