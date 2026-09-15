import type { CSSProperties } from "react";

export type SaloraProductPreviewProps = {
  productName: string;
  imageUrl?: string | null;
  tagline?: string;
  progress?: number;
};

// Remotion-ready pure React composition. P77-B keeps it dependency-free so the
// existing Next.js Preview can validate the visual contract before a render
// worker is introduced. The next phase can wrap this component with Remotion's
// Composition/useCurrentFrame without changing its product/brand contract.
export function SaloraProductPreviewComposition({ productName, imageUrl, tagline = "Taste the Harmony", progress = 0.55 }: SaloraProductPreviewProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const imageStyle: CSSProperties = { transform: `scale(${1.02 + clamped * 0.06})` };
  return <div className="relative h-full w-full overflow-hidden bg-[#080808] text-[#f6efe3]">
    {imageUrl ? <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700" style={imageStyle} /> : null}
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/20" />
    <div className="absolute inset-x-[7%] bottom-[8%]">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#d7b36a]">{tagline}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{productName}</h2>
      <div className="mt-4 h-px w-16 bg-[#c9a45c]" />
    </div>
  </div>;
}
