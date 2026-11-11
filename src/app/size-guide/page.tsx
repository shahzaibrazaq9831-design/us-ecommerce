import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import InfoPageLayout from "@/components/InfoPageLayout";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Size Guide",
  description:
    "Find your measurements in inches, see the full size chart and learn how to measure chest, waist and hips before you order a made-to-order dress.",
  path: "/size-guide",
});

const SIZE_CHART = [
  { size: "2XS", chest: 32, waist: 26, hips: 35 },
  { size: "XS", chest: 34, waist: 28, hips: 37 },
  { size: "S", chest: 36, waist: 30, hips: 39 },
  { size: "M", chest: 38, waist: 32, hips: 41 },
  { size: "L", chest: 40, waist: 34, hips: 43 },
  { size: "XL", chest: 42, waist: 36, hips: 45 },
  { size: "2XL", chest: 44, waist: 38, hips: 47 },
];

const MEASURING = [
  {
    title: "Chest / Bust",
    copy: "Around the fullest part of your chest, tape level all the way round and comfortably relaxed.",
  },
  {
    title: "Waist",
    copy: "Around your natural waistline — the narrowest point above your navel. Do not pull the tape tight.",
  },
  {
    title: "Hips",
    copy: "Stand with your feet together and measure around the fullest part of your hips and seat.",
  },
  {
    title: "Shoulders",
    copy: "From the edge of one shoulder to the other, across the back where the seam sits.",
  },
];

export default function SizeGuidePage() {
  return (
    <InfoPageLayout
      title="Size Guide"
      intro="Everything here is measured in inches. Measure once, keep the numbers, and you can order with confidence."
    >
      <section className="info-section">
        <h2>The short version</h2>
        <p>
          Between two sizes? Take the larger one — it is easier to take in than to let
          out. If you would rather we stitched to your exact measurements, choose the
          custom option on the product page and send us your numbers.
        </p>
      </section>

      <section className="info-section">
        <h2>Size chart</h2>
        <div className="info-table-wrap">
          <table className="info-table">
            <thead>
              <tr>
                <th scope="col">Size</th>
                <th scope="col">Chest (in)</th>
                <th scope="col">Waist (in)</th>
                <th scope="col">Hips (in)</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((row) => (
                <tr key={row.size}>
                  <th scope="row">{row.size}</th>
                  <td>{row.chest}</td>
                  <td>{row.waist}</td>
                  <td>{row.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="info-section">
        <h2>The full chart</h2>
        <Image
          src="/images/sizechart.jfif"
          alt="Size chart for shirts, maxi gowns, lehenga cholis and trousers, from 2XS to 2XL, measurements in inches"
          width={1211}
          height={880}
          sizes="(max-width: 768px) 100vw, 760px"
          className="info-image"
        />
        <p>
          The same chart is on the <Link href="/size-chart">size chart</Link> page if you
          would rather open it on its own.
        </p>
      </section>

      <section className="info-section">
        <h2>How to measure</h2>
        <div className="measure-grid">
          {MEASURING.map((item) => (
            <div key={item.title} className="measure-card">
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="info-section">
        <h2>Ordering to your own measurements</h2>
        <p>
          Send us your chest, waist, hips and the lengths you want, with your order
          number. We read the numbers back to you and only start stitching once you
          have confirmed them. More on the{" "}
          <Link href="/custom-stitching">custom stitching</Link> page.
        </p>
      </section>
    </InfoPageLayout>
  );
}
