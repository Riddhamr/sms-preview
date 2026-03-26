import { ImageResponse } from "next/og";

export const runtime = "edge";

const PREVIEW_IMAGES: Record<string, { path: string; w: number; h: number }> = {
  default: { path: "/confirm-pharmacy-og-preview.png", w: 265, h: 88 },
  ins: { path: "/need-ins-og-preview.png", w: 265, h: 82 },
  upd: { path: "/med-updates-og-preview.png", w: 265, h: 82 },
};

const OUTPUT_WIDTH = 1200;

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const version = searchParams.get("v") || "default";
  const img = PREVIEW_IMAGES[version] ?? PREVIEW_IMAGES["default"];
  const imgSrc = `${origin}${img.path}`;
  const outputHeight = Math.round((img.h / img.w) * OUTPUT_WIDTH);

  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imgSrc} width={OUTPUT_WIDTH} height={outputHeight} alt="" />,
    { width: OUTPUT_WIDTH, height: outputHeight },
  );
}
