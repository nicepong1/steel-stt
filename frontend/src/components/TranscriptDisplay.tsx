"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/hooks/useSTTWebSocket";
import { EditableTranscript } from "@/components/EditableTranscript";
import { HighlightedText } from "@/components/HighlightedText";

interface TranscriptDisplayProps {
  transcripts: TranscriptEntry[];
  currentPartial: string;
  onUpdateTranscript?: (index: number, newText: string) => void;
}

export function TranscriptDisplay({
  transcripts,
  currentPartial,
  onUpdateTranscript,
}: TranscriptDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 텍스트가 추가되면 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts, currentPartial]);

  const isEmpty = transcripts.length === 0 && !currentPartial;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-6 min-h-[200px] max-h-[60vh] overflow-y-auto">
      {isEmpty ? (
        <p className="text-gray-400 text-center mt-16">
          마이크 버튼을 눌러 음성 주문을 시작하세요
        </p>
      ) : (
        <div className="space-y-1">
          {/* 확정된 텍스트 - 하이라이팅 + 클릭 수정 */}
          {transcripts.map((entry, i) => (
            <EditableTranscript
              key={i}
              text={entry.text}
              onUpdate={(newText) => onUpdateTranscript?.(i, newText)}
            />
          ))}

          {/* 현재 인식 중인 텍스트 (회색 + 하이라이팅) */}
          {currentPartial && (
            <p className="text-lg leading-relaxed italic text-gray-400">
              <HighlightedText
                text={currentPartial}
                className="opacity-60"
              />
            </p>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
