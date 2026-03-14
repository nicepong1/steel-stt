"use client";

import { useRef, useState, useCallback } from "react";

interface UseAudioCaptureOptions {
  /** 오디오 청크 콜백 - PCM 16-bit 16kHz mono ArrayBuffer */
  onAudioChunk: (chunk: ArrayBuffer) => void;
  /** 청크 전송 간격 (ms) */
  chunkIntervalMs?: number;
}

/** 브라우저 마이크에서 PCM 16-bit 16kHz mono 오디오를 캡처하는 훅 */
export function useAudioCapture({
  onAudioChunk,
  chunkIntervalMs = 100,
}: UseAudioCaptureOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const bufferRef = useRef<Float32Array[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onChunkRef = useRef(onAudioChunk);
  onChunkRef.current = onAudioChunk;

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    streamRef.current = stream;

    const audioContext = new AudioContext({ sampleRate: 16000 });
    contextRef.current = audioContext;

    // sampleRate가 16kHz가 아닐 수 있으므로 실제 값을 기록
    const actualSampleRate = audioContext.sampleRate;

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      bufferRef.current.push(new Float32Array(inputData));
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    // 일정 간격으로 버퍼를 모아서 PCM 16-bit로 변환 후 전송
    intervalRef.current = setInterval(() => {
      const chunks = bufferRef.current;
      if (chunks.length === 0) return;
      bufferRef.current = [];

      // Float32 합치기
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      // 다운샘플링 (브라우저 sampleRate → 16kHz)
      const downsampled = downsample(merged, actualSampleRate, 16000);

      // Float32 → Int16 PCM 변환
      const pcm = float32ToInt16(downsampled);
      onChunkRef.current(pcm.buffer as ArrayBuffer);
    }, chunkIntervalMs);

    setIsRecording(true);
  }, [chunkIntervalMs]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (contextRef.current) {
      contextRef.current.close();
      contextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    bufferRef.current = [];
    setIsRecording(false);
  }, []);

  return { isRecording, start, stop };
}

/** 다운샘플링: srcRate → dstRate */
function downsample(
  buffer: Float32Array,
  srcRate: number,
  dstRate: number,
): Float32Array {
  if (srcRate === dstRate) return buffer;
  const ratio = srcRate / dstRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    result[i] = buffer[Math.round(i * ratio)];
  }
  return result;
}

/** Float32 [-1, 1] → Int16 PCM */
function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}
