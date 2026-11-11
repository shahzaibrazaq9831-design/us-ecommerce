import { ImageResponse } from "next/og";

export const alt = "Rung E Bahar — luxury designer-inspired dresses made to order";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The social card for the whole site. It is generated at build time, so the
 * copy below is the only thing you need to edit to change how a shared link
 * looks.
 */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1A1A1A",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#C9A96E",
            }}
          >
            Rung E Bahar
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 72,
              lineHeight: 1.05,
              color: "#FFFFFF",
              fontWeight: 700,
            }}
          >
            Luxury designer-inspired dresses, made to order
          </div>
          <div style={{ marginTop: 26, fontSize: 32, color: "#BDBDBD" }}>
            Bridal · Wedding · Formals · Chiffon
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #C9A96E",
            paddingTop: 28,
            fontSize: 26,
            color: "#E0E0E0",
          }}
        >
          <span>Free worldwide shipping</span>
          <span>Unstitched · Standard · Custom</span>
          <span>rungebahar.com</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
