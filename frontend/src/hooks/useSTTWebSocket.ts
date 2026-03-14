"use client";

import { useRef, useState, useCallback } from "react";

export interface TranscriptEntry {
  text: string;
  isFinal: boolean;
  confidence: number;
}

interface STTMessage {
  text: string;
  is_final: boolean;
  confidence: number;
}

/** WebSocket으로 오디오를 전송하고 STT 결과를 수신하는 훅 */
export function useSTTWebSocket(wsUrl: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [currentPartial, setCurrentPartial] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current) return;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      const data: STTMessage = JSON.parse(event.data);

      if (data.is_final) {
        // final → 확정 텍스트 목록에 추가, partial 초기화
        setTranscripts((prev) => [
          ...prev,
          { text: data.text, isFinal: true, confidence: data.confidence },
        ]);
        setCurrentPartial("");
      } else {
        // partial → 실시간 표시용
        setCurrentPartial(data.text);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [wsUrl]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  /** 바이너리 오디오 청크를 서버로 전송 */
  const sendAudioChunk = useCallback((chunk: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(chunk);
    }
  }, []);

  /** 특정 인덱스의 transcript 텍스트 수정 (오인식 수동 교정용) */
  const updateTranscript = useCallback((index: number, newText: string) => {
    setTranscripts((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, text: newText } : entry
      )
    );
  }, []);

  /** 결과 초기화 */
  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setCurrentPartial("");
  }, []);

  return {
    isConnected,
    transcripts,
    currentPartial,
    connect,
    disconnect,
    sendAudioChunk,
    updateTranscript,
    clearTranscripts,
  };
}
