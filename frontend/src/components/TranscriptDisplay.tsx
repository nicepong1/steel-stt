"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/hooks/useSTTWebSocket";

interface TranscriptDisplayProps {
  transcripts: TranscriptEntry[];
  currentPartial: string;
}

export function TranscriptDisplay({
  transcripts,
  currentPartial,
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
          {/* 확정된 텍스트 (검은색) */}
          {transcripts.map((entry, i) => (
            <p key={i} className="text-gray-900 text-lg leading-relaxed">
              {entry.text}
            </p>
          ))}

          {/* 현재 인식 중인 텍스트 (회색) */}
          {currentPartial && (
            <p className="text-gray-400 text-lg leading-relaxed italic">
              {currentPartial}
            </p>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
