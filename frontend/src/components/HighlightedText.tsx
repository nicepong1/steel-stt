"use client";

import { highlightText, type SegmentType } from "@/utils/steelKeywords";

const STYLE_MAP: Record<SegmentType, string> = {
  product: "text-blue-600 font-semibold",
  quantity: "text-green-600 font-semibold",
  normal: "",
};

interface HighlightedTextProps {
  text: string;
  className?: string;
}

export function HighlightedText({ text, className = "" }: HighlightedTextProps) {
  const segments = highlightText(text);

  return (
    <span className={className}>
      {segments.map((seg, i) => (
        <span key={i} className={STYLE_MAP[seg.type]}>
          {seg.text}
        </span>
      ))}
    </span>
  );
}
