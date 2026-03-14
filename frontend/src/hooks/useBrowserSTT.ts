"use client";

import { useRef, useState, useCallback } from "react";
import type { TranscriptEntry } from "@/hooks/useSTTWebSocket";

/**
 * 브라우저 내장 Web Speech API를 사용하는 STT 훅.
 * API 키 없이 실제 음성인식 테스트 가능.
 * Chrome, Edge 등 Chromium 기반 브라우저에서 동작.
 */
export function useBrowserSTT() {
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [currentPartial, setCurrentPartial] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("이 브라우저는 음성인식을 지원하지 않습니다. Chrome을 사용해주세요.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          setTranscripts((prev) => [
            ...prev,
            {
              text,
              isFinal: true,
              confidence: result[0].confidence,
            },
          ]);
          setCurrentPartial("");
        } else {
          setCurrentPartial(text);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // continuous 모드에서도 끊길 수 있으므로 재시작
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null; // onend에서 재시작 방지
      ref.stop();
    }
    setIsListening(false);
  }, []);

  const updateTranscript = useCallback((index: number, newText: string) => {
    setTranscripts((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, text: newText } : entry
      )
    );
  }, []);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setCurrentPartial("");
  }, []);

  return {
    isListening,
    transcripts,
    currentPartial,
    start,
    stop,
    updateTranscript,
    clearTranscripts,
  };
}
