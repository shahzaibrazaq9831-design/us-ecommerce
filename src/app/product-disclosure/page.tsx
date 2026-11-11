import type { Metadata } from "next";
import Link from "next/link";
import InfoPageLayout from "@/components/InfoPageLayout";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Product Disclosure",
  description:
    "What is in the box, how our dresses are made, how to care for them and an honest note about colours, handwork and designer-inspired pieces.",
  path: "/product-disclosure",
});

export default function ProductDisclosurePage() {
  return (
    <InfoPageLayout
      title="Product Disclosure"
      intro="Plain details about what you are buying — the fabric, the work, what arrives in the box, and the small differences you should expect."
    >
      <section className="info-section">
        <h2>What arrives in the box</h2>
        <ul>
          <li>The dress itself — kameez, trouser or shalwar, and dupatta where the style calls for it.</li>
          <li>Any separate lining or underskirt that is part of the style.</li>
          <li>A dust bag for the outfit.</li>
          <li>Your measurements and stitching notes, printed on the invoice.</li>
        </ul>
        <p>
          Trousers, shalwar and any separate fall-and-frill piece are shown in the
          product photos. If something is not in the pictures, write to us before you
          order and we will send a photo.
        </p>
      </section>

      <section className="info-section">
        <h2>How the pieces are made</h2>
        <p>
          Every order is stitched after you order it. We work with small studios and
          skilled finishers, which means the embroidery, sequins and beadwork are
          applied by hand. Handwork is the reason a piece looks the way it does — and
          also the reason two identical designs are never quite identical.
        </p>
        <p>
          Pieces can be made unstitched, stitched to a standard size, or stitched to
          your own measurements. The{" "}
          <Link href="/custom-stitching">custom stitching page</Link> explains all three.
        </p>
      </section>

      <section className="info-section">
        <h2>Fabric and colour</h2>
        <p>
          Photography lights change how a colour reads on screen. We shoot each piece
          in daylight and keep the photos as true as we can, but a maroon on your
          screen can look warmer than the same maroon in your room. If you need a
          truer view, ask us for a daylight photo or a short video on WhatsApp.
        </p>
        <p>
          Silk, chiffon and organza are natural fabrics and they move and drape
          differently from the polyester blends we also use. Both are named on each
          product page.
        </p>
      </section>

      <section className="info-section">
        <h2>Care</h2>
        <ul>
          <li>Dry clean only, or hand wash gently in cold water for lighter fabrics.</li>
          <li>Iron on the reverse, on a low setting, and never directly over sequins or beads.</li>
          <li>Store folded in a muslin cover rather than on a hanger.</li>
          <li>Keep the outfit away from direct sunlight to protect the colour and the shine of the work.</li>
        </ul>
      </section>

      <section className="info-section">
        <h2>Designer-inspired pieces</h2>
        <p>
          Our designs are our own, made in the spirit of the Pakistani formalwear you
          love. We are not the original house behind any look we are inspired by, and
          we do not sell their products. Where a style borrows a name or a detail, it is
          our own version of it, cut and finished by our studios.
        </p>
      </section>

      <section className="info-section">
        <h2>Returns and faults</h2>
        <p>
          Made-to-order pieces cannot be returned unless they are faulty or not as
          described. If something is wrong with your order, write to us within seven
          days of delivery with a photo and we will sort it out. The{" "}
          <Link href="/returns">returns page</Link> has the detail.
        </p>
      </section>
    </InfoPageLayout>
  );
}
