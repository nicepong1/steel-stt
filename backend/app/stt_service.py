from __future__ import annotations

import asyncio
import random
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncGenerator


@dataclass
class STTResult:
    """STT 변환 결과"""
    text: str
    is_final: bool
    confidence: float = 0.0


class STTService(ABC):
    """STT 서비스 추상 인터페이스 - 향후 자체 모델로 교체 시 이 인터페이스만 구현"""

    @abstractmethod
    async def stream(self, audio_chunks: AsyncGenerator[bytes, None]) -> AsyncGenerator[STTResult, None]:
        """오디오 청크 스트림을 받아 STT 결과를 스트리밍 반환"""
        ...

    @abstractmethod
    async def close(self) -> None:
        """리소스 정리"""
        ...


# ── Mock 구현: API 키 없이 구조 테스트용 ──

# 철강 관련 시뮬레이션 문장들
_MOCK_SENTENCES = [
    "H빔 10톤 주문할게",
    "철근 SD400 16mm 5톤 보내주세요",
    "강판 두께 6mm 3톤 견적 부탁합니다",
    "각파이프 50x50 2톤 내일 배송 가능한가요",
    "평철 9mm 1톤 추가 주문이요",
]


class MockSTTService(STTService):
    """Mock STT - 오디오 청크를 받으면 철강 관련 문장을 시뮬레이션 반환"""

    async def stream(self, audio_chunks: AsyncGenerator[bytes, None]) -> AsyncGenerator[STTResult, None]:
        sentence = random.choice(_MOCK_SENTENCES)
        words = sentence.split()
        chunk_count = 0

        async for _chunk in audio_chunks:
            chunk_count += 1

            # 3청크마다 partial 결과 전송 (실시간 느낌)
            if chunk_count % 3 == 0:
                # 점진적으로 단어를 늘려가며 partial 표시
                partial_end = min(len(words), (chunk_count // 3))
                if partial_end > 0:
                    partial_text = " ".join(words[:partial_end])
                    yield STTResult(text=partial_text, is_final=False, confidence=0.0)

            # 10청크 이상이면 최종 결과 반환
            if chunk_count >= 10:
                yield STTResult(text=sentence, is_final=True, confidence=0.95)
                # 다음 문장으로 리셋
                sentence = random.choice(_MOCK_SENTENCES)
                words = sentence.split()
                chunk_count = 0

        # 스트림 종료 시 남은 partial이 있으면 final로 전송
        if chunk_count > 0:
            yield STTResult(text=sentence, is_final=True, confidence=0.90)

    async def close(self) -> None:
        pass


# ── Google Cloud Speech-to-Text 구현 ──

class GoogleSTTService(STTService):
    """Google Cloud Speech-to-Text Streaming API 연동"""

    def __init__(self, credentials_path: str) -> None:
        self._credentials_path = credentials_path
        self._client = None

    async def _ensure_client(self) -> None:
        if self._client is not None:
            return
        try:
            from google.cloud import speech
            import os
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self._credentials_path
            self._client = speech.SpeechAsyncClient()
        except Exception as e:
            raise RuntimeError(
                f"Google STT 클라이언트 초기화 실패: {e}\n"
                "GOOGLE_APPLICATION_CREDENTIALS 경로를 확인하세요."
            )

    async def stream(self, audio_chunks: AsyncGenerator[bytes, None]) -> AsyncGenerator[STTResult, None]:
        from google.cloud import speech

        await self._ensure_client()

        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="ko-KR",
            enable_automatic_punctuation=True,
        )
        streaming_config = speech.StreamingRecognitionConfig(
            config=config,
            interim_results=True,  # partial 결과도 받기
        )

        async def request_generator():
            # 첫 번째 요청: 설정 전송
            yield speech.StreamingRecognizeRequest(streaming_config=streaming_config)
            # 이후 요청: 오디오 데이터 전송
            async for chunk in audio_chunks:
                yield speech.StreamingRecognizeRequest(audio_content=chunk)

        responses = await self._client.streaming_recognize(requests=request_generator())

        async for response in responses:
            for result in response.results:
                alternative = result.alternatives[0]
                yield STTResult(
                    text=alternative.transcript,
                    is_final=result.is_final,
                    confidence=alternative.confidence if result.is_final else 0.0,
                )

    async def close(self) -> None:
        if self._client:
            await self._client.__aexit__(None, None, None)
            self._client = None


def create_stt_service(service_type: str, credentials_path: str = "") -> STTService:
    """설정에 따라 적절한 STT 서비스 인스턴스 생성"""
    if service_type == "google":
        if not credentials_path:
            raise ValueError("Google STT 사용 시 GOOGLE_APPLICATION_CREDENTIALS 설정 필요")
        return GoogleSTTService(credentials_path)
    return MockSTTService()
