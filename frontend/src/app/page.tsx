"use client";

import { useCallback } from "react";
import { MicButton } from "@/components/MicButton";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { useSTTWebSocket } from "@/hooks/useSTTWebSocket";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/stt";

export default function Home() {
  const {
    isConnected,
    transcripts,
    currentPartial,
    connect,
    disconnect,
    sendAudioChunk,
    clearTranscripts,
  } = useSTTWebSocket(WS_URL);

  const { isRecording, start, stop } = useAudioCapture({
    onAudioChunk: sendAudioChunk,
  });

  const handleMicClick = useCallback(async () => {
    if (isRecording) {
      stop();
      disconnect();
    } else {
      connect();
      await start();
    }
  }, [isRecording, start, stop, connect, disconnect]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-8">
      {/* 헤더 */}
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Steel STT
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          음성으로 주문하세요
        </p>
      </header>

      {/* 상태 표시 */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span
          className={`h-2 w-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-gray-300"
          }`}
        />
        <span className="text-gray-600">
          {isRecording
            ? "음성 인식 중..."
            : isConnected
              ? "연결됨"
              : "대기 중"}
        </span>
      </div>

      {/* STT 결과 표시 */}
      <TranscriptDisplay
        transcripts={transcripts}
        currentPartial={currentPartial}
      />

      {/* 하단 컨트롤 */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <MicButton isRecording={isRecording} onClick={handleMicClick} />

        {transcripts.length > 0 && !isRecording && (
          <button
            onClick={clearTranscripts}
            className="text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer"
          >
            결과 지우기
          </button>
        )}
      </div>
    </div>
  );
}
