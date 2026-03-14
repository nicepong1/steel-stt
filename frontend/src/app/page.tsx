"use client";

import { useCallback, useState } from "react";
import { MicButton } from "@/components/MicButton";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { useSTTWebSocket } from "@/hooks/useSTTWebSocket";
import { useBrowserSTT } from "@/hooks/useBrowserSTT";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/stt";

type STTMode = "browser" | "websocket";

export default function Home() {
  const [mode, setMode] = useState<STTMode>("browser");

  // WebSocket + Mock/Google STT 모드
  const ws = useSTTWebSocket(WS_URL);
  const audio = useAudioCapture({ onAudioChunk: ws.sendAudioChunk });

  // 브라우저 내장 음성인식 모드
  const browser = useBrowserSTT();

  const isActive = mode === "browser" ? browser.isListening : audio.isRecording;
  const transcripts = mode === "browser" ? browser.transcripts : ws.transcripts;
  const currentPartial = mode === "browser" ? browser.currentPartial : ws.currentPartial;
  const updateTranscript = mode === "browser" ? browser.updateTranscript : ws.updateTranscript;
  const clearTranscripts = mode === "browser" ? browser.clearTranscripts : ws.clearTranscripts;

  const handleMicClick = useCallback(async () => {
    if (mode === "browser") {
      if (browser.isListening) {
        browser.stop();
      } else {
        browser.start();
      }
    } else {
      if (audio.isRecording) {
        audio.stop();
        ws.disconnect();
      } else {
        ws.connect();
        await audio.start();
      }
    }
  }, [mode, browser, audio, ws]);

  const handleModeChange = (newMode: STTMode) => {
    // 활성 중이면 먼저 중지
    if (browser.isListening) browser.stop();
    if (audio.isRecording) {
      audio.stop();
      ws.disconnect();
    }
    setMode(newMode);
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-8">
      {/* 헤더 */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Steel STT</h1>
        <p className="mt-1 text-sm text-gray-500">음성으로 주문하세요</p>
      </header>

      {/* 모드 선택 */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-200 p-1">
        <button
          onClick={() => handleModeChange("browser")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            mode === "browser"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          브라우저 음성인식
        </button>
        <button
          onClick={() => handleModeChange("websocket")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            mode === "websocket"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          서버 연동 (Mock)
        </button>
      </div>

      {/* 상태 표시 */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span
          className={`h-2 w-2 rounded-full ${
            isActive ? "bg-green-500" : "bg-gray-300"
          }`}
        />
        <span className="text-gray-600">
          {isActive ? "음성 인식 중..." : "대기 중"}
        </span>
      </div>

      {/* STT 결과 표시 */}
      <TranscriptDisplay
        transcripts={transcripts}
        currentPartial={currentPartial}
        onUpdateTranscript={updateTranscript}
      />

      {/* 하단 컨트롤 */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <MicButton isRecording={isActive} onClick={handleMicClick} />

        {transcripts.length > 0 && !isActive && (
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
