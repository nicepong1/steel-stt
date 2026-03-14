from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.stt_service import STTResult, create_stt_service

app = FastAPI(title="Steel STT Backend", version="0.1.0")

# CORS 설정 (프론트엔드 연동 대비)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 단계에서만 * 허용, 배포 시 제한 필요
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "stt_service": settings.stt_service,
    }


@app.websocket("/ws/stt")
async def websocket_stt(ws: WebSocket):
    await ws.accept()

    stt = create_stt_service(
        service_type=settings.stt_service,
        credentials_path=settings.google_application_credentials,
    )

    # 클라이언트 → 서버 오디오 스트림을 AsyncGenerator로 변환
    audio_queue: asyncio.Queue[bytes | None] = asyncio.Queue()

    async def audio_generator() -> AsyncGenerator[bytes, None]:
        while True:
            chunk = await audio_queue.get()
            if chunk is None:
                break
            yield chunk

    async def receive_audio():
        """클라이언트에서 오디오 청크를 수신하여 큐에 넣기"""
        try:
            while True:
                data = await ws.receive_bytes()
                await audio_queue.put(data)
        except WebSocketDisconnect:
            await audio_queue.put(None)

    async def send_results():
        """STT 결과를 클라이언트에 JSON으로 전송"""
        try:
            async for result in stt.stream(audio_generator()):
                message = json.dumps(
                    {
                        "text": result.text,
                        "is_final": result.is_final,
                        "confidence": result.confidence,
                    },
                    ensure_ascii=False,
                )
                await ws.send_text(message)
        except WebSocketDisconnect:
            pass
        finally:
            await stt.close()

    # 수신/송신을 동시에 실행
    receive_task = asyncio.create_task(receive_audio())
    send_task = asyncio.create_task(send_results())

    try:
        await asyncio.gather(receive_task, send_task)
    except Exception:
        receive_task.cancel()
        send_task.cancel()
        await stt.close()
