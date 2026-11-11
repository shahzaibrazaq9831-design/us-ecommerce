import type { Metadata } from "next";
import Link from "next/link";
import InfoPageLayout from "@/components/InfoPageLayout";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Custom Stitching",
  description:
    "Three ways to receive your dress: unstitched, stitched to a standard size, or made to your own measurements. How each option works and what to expect.",
  path: "/custom-stitching",
});

const OPTIONS = [
  {
    name: "Unstitched",
    copy: "You receive the cut fabric, ready for your own tailor. Send us the pieces you need and stitch the outfit however you like.",
  },
  {
    name: "Standard",
    copy: "Pick one of our ready sizes and our team stitches the piece to it, using the measurements on our size guide. This is the quickest option.",
  },
  {
    name: "Custom",
    copy: "Share your own measurements and any length preferences, and we stitch the piece to you. We confirm everything with you before we start.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Choose how you want it",
    copy: "Pick unstitched, standard or custom on the product page. You can change your mind later by writing to us with your order number.",
  },
  {
    step: "02",
    title: "Send your measurements",
    copy: "For a custom order, send us your chest, waist, hips and the lengths you want. A photo of a tape measure is fine.",
  },
  {
    step: "03",
    title: "We confirm and stitch",
    copy: "We check the details with you first. Nothing is cut until you are happy with the measurements.",
  },
  {
    step: "04",
    title: "Finished and dispatched",
    copy: "Your piece is stitched, checked, pressed and packed before it leaves us. You get a tracking link the moment it ships.",
  },
];

export default function CustomStitchingPage() {
  return (
    <InfoPageLayout
      title="Custom Stitching"
      intro="Every dress in the shop can be made three ways. Pick the one that suits you — nothing costs extra for standard or custom sizing."
    >
      <section className="info-section">
        <h2>Three ways to receive your dress</h2>
        <div className="option-grid">
          {OPTIONS.map((option) => (
            <div key={option.name} className="option-card">
              <h3>{option.name}</h3>
              <p>{option.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="info-section">
        <h2>How a custom order works</h2>
        <ol className="step-list">
          {STEPS.map((item) => (
            <li key={item.step} className="step-item">
              <span className="step-number" aria-hidden="true">
                {item.step}
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="info-section">
        <h2>Measuring yourself</h2>
        <p>
          Measurements are in inches. Keep the tape level, close to the body but not
          tight, and measure over the underwear you would wear with the outfit. If you
          are between two sizes, take the larger one — or send us your measurements and
          let us decide.
        </p>
        <p>
          The full chart is on the <Link href="/size-guide">size guide</Link> page, and
          the piece we use for every order is on the{" "}
          <Link href="/size-chart">size chart</Link> page.
        </p>
      </section>

      <section className="info-section">
        <h2>How long it takes</h2>
        <p>
          Stitching starts once we have your measurements and the order is confirmed.
          Most pieces are ready within 10–14 working days. If you have a date in mind,
          tell us before you order and we will tell you honestly whether we can hit it.
        </p>
      </section>

      <section className="info-section">
        <h2>Things worth knowing</h2>
        <ul>
          <li>Measurements are confirmed in writing before we cut anything.</li>
          <li>Small adjustments are free on standard sizes within seven days of delivery.</li>
          <li>Hand-finished pieces can vary slightly — that is what hand-finished means.</li>
          <li>Unstitched pieces cannot be returned once the fabric is cut to your instructions.</li>
        </ul>
      </section>
    </InfoPageLayout>
  );
}
