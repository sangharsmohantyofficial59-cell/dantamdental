import { ImageResponse } from "next/og";

export const alt = "Dantam Dental Care, Bhubaneswar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0B6E6E",
          color: "#FFFFFF",
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 700 }}>Dantam Dental Care</div>
        <div style={{ fontSize: 40, marginTop: 20, color: "#E2F0EE" }}>Gentle dental care. Book online.</div>
      </div>
    ),
    size,
  );
}
