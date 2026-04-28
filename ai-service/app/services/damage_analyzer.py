from __future__ import annotations

from typing import List

from app.model_loader import YoloDamageDetector
from app.ollama_client import OllamaClient
from app.schemas import AnalyzeDamageResponse, DamageDetection


class DamageAnalyzerService:
    def __init__(self, detector: YoloDamageDetector, ollama_client: OllamaClient) -> None:
        self.detector = detector
        self.ollama_client = ollama_client

    async def analyze(self, image_bytes: bytes, description: str) -> AnalyzeDamageResponse:
        detections: List[DamageDetection] = self.detector.detect(image_bytes)

        if detections:
            detected_damages_text = ", ".join(
                f"{item.label} (guven={item.confidence:.2f})" for item in detections
            )
        else:
            detected_damages_text = "Gorselde belirgin hasar tespit edilmedi"

        report = await self.ollama_client.generate_report(
            detected_damages_text=detected_damages_text,
            customer_description=description,
        )

        if not report:
            report = "LLM raporu bos dondu. Lutfen tekrar deneyin."

        return AnalyzeDamageResponse(
            detected_damages=detections,
            ai_analysis_report=report,
        )
