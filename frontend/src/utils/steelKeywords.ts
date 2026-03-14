/** 철강 품목 키워드 */
const STEEL_PRODUCTS = [
  "H빔", "h빔", "에이치빔",
  "철근", "강판", "평철", "환봉", "각파이프", "원형관",
  "앵글", "채널", "형강", "빔", "플레이트",
  "파이프", "각관", "원관", "플랫바", "라운드바",
  "SS400", "ss400", "SD400", "sd400", "SD500", "sd500",
  "STS", "SUS", "스테인리스",
  "아연도강판", "컬러강판", "후판", "중판", "박판",
  "데크플레이트", "와이어메쉬", "철판",
];

/** 숫자+단위 패턴 */
const QUANTITY_PATTERN =
  /\d+(?:\.\d+)?\s*(?:톤|t|T|kg|KG|mm|MM|m|M|개|본|장|EA|ea|매|묶음|롤|박스)/g;

/** 품목 정규식 (긴 키워드 우선 매칭) */
const productPattern = STEEL_PRODUCTS
  .sort((a, b) => b.length - a.length)
  .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");
const PRODUCT_PATTERN = new RegExp(productPattern, "gi");

export type SegmentType = "product" | "quantity" | "normal";

export interface TextSegment {
  text: string;
  type: SegmentType;
}

/** 텍스트를 product/quantity/normal 세그먼트로 분리 */
export function highlightText(text: string): TextSegment[] {
  // 모든 매치 위치를 수집
  const matches: { start: number; end: number; type: SegmentType }[] = [];

  // 품목 매치
  PRODUCT_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PRODUCT_PATTERN.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, type: "product" });
  }

  // 수량 매치
  QUANTITY_PATTERN.lastIndex = 0;
  while ((m = QUANTITY_PATTERN.exec(text)) !== null) {
    // 이미 product로 매치된 범위와 겹치지 않는 경우만
    const overlaps = matches.some(
      (existing) => m!.index < existing.end && m!.index + m![0].length > existing.start
    );
    if (!overlaps) {
      matches.push({ start: m.index, end: m.index + m[0].length, type: "quantity" });
    }
  }

  // 위치 순으로 정렬
  matches.sort((a, b) => a.start - b.start);

  // 세그먼트 조립
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({ text: text.slice(cursor, match.start), type: "normal" });
    }
    segments.push({ text: text.slice(match.start, match.end), type: match.type });
    cursor = match.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), type: "normal" });
  }

  return segments.length > 0 ? segments : [{ text, type: "normal" }];
}
