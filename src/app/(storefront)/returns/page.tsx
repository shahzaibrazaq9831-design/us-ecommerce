import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";
import { getStorefrontSettings } from "@/lib/storefront-settings";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description:
    "Cancel within 12 hours of ordering. Refund or replacement for defective or damaged items. No change-of-mind returns or exchanges.",
};

type PolicyBlock = { heading?: string; body: string };

function parsePolicy(text: string): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  let heading: string | undefined;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("## ")) {
      heading = trimmed.slice(3).trim();
      continue;
    }
    blocks.push({ heading, body: trimmed });
    heading = undefined;
  }

  return blocks;
}

export default async function ReturnsPage() {
  const { returnsText } = await getStorefrontSettings();
  const blocks = parsePolicy(returnsText);

  return (
    <InfoPageLayout
      title="Returns & Refunds"
      intro="Our clear, simple policy for cancellations, defective items and refunds."
    >
      {blocks.map((block, index) => (
        <section className="info-section" key={`${block.heading ?? "policy"}-${index}`}>
          {block.heading ? <h2>{block.heading}</h2> : null}
          <p>{block.body}</p>
        </section>
      ))}
    </InfoPageLayout>
  );
}
