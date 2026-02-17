import { NextResponse } from "next/server";

// Use require to avoid type resolution issues in build environments
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bwipjs = require("bwip-js") as { toSVG: (opts: any) => string };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "";
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  try {
    const svg = bwipjs.toSVG({
      bcid: "code128",
      text,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: "center"
    });
    return new NextResponse(svg, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Barcode error" }, { status: 500 });
  }
}
