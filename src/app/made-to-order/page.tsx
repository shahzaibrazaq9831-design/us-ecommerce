import type { Metadata } from "next";
import Link from "next/link";
import InfoPageLayout from "@/components/InfoPageLayout";

export const metadata: Metadata = {
  title: "Made-to-Order Stitching | Premium Pakistani Dresses",
  description:
    "Choose a standard size or send us your custom measurements — every outfit is tailored to you. Size chart, measuring guide and stitching time.",
};

const SIZE_CHART = [
  { size: "2XS", chest: 32, waist: 26, hips: 35 },
  { size: "XS", chest: 34, waist: 28, hips: 37 },
  { size: "S", chest: 36, waist: 30, hips: 39 },
  { size: "M", chest: 38, waist: 32, hips: 41 },
  { size: "L", chest: 40, waist: 34, hips: 43 },
  { size: "XL", chest: 42, waist: 36, hips: 45 },
  { size: "2XL", chest: 44, waist: 38, hips: 47 },
];

export default function MadeToOrderPage() {
  return (
    <InfoPageLayout
      title="Made-to-Order Stitching"
      intro="Every outfit is stitched to order — pick a standard size or share your own measurements."
    >
      <section className="info-section">
        <h2>Standard size or custom measurements</h2>
        <p>
          At checkout you can choose a standard size, or select custom stitching
          and tell us your measurements. Custom-stitched pieces are tailored just
          for you, so fit details like length, sleeves and waist are made exactly
          to your body.
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
        <p style={{ marginTop: "10px" }}>
          Measurements are in inches. If you are between sizes, we recommend
          choosing the larger size. See the full{" "}
          <Link href="/size-chart">Size Chart</Link> page for detailed guidance on
          how to measure yourself.
        </p>
      </section>

      <section className="info-section">
        <h2>How to send us your measurements</h2>
        <p>
          Place your order, then send your measurements (chest, waist, hips, and
          any length preferences) referencing your order number:
        </p>
        <ul>
          {/* TODO: replace with the real support email before going live */}
          <li>Email: TODO — add support email</li>
          {/* TODO: replace with the real WhatsApp number before going live */}
          <li>WhatsApp: TODO — add WhatsApp number</li>
        </ul>
        <p style={{ marginTop: "10px" }}>
          We confirm the measurements with you before stitching begins, so nothing
          is made until you are happy with the fit details.
        </p>
      </section>

      <section className="info-section">
        <h2>Stitching time</h2>
        {/* TODO: confirm and set the real made-to-order stitching time */}
        <p>TODO — stitching time will be announced here (e.g. X–Y business days).</p>
      </section>
    </InfoPageLayout>
  );
}
