from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.model_loader import YoloDamageDetector
from app.ollama_client import OllamaClient
from app.schemas import AnalyzeDamageForm, AnalyzeDamageResponse, AnalyzeTextForm, AnalyzeTextResponse
from app.services.damage_analyzer import DamageAnalyzerService


def _build_service() -> DamageAnalyzerService:
    detector = YoloDamageDetector(
        model_path=str(settings.yolo_model_path),
        conf_threshold=settings.yolo_confidence_threshold,
    )
    ollama = OllamaClient(
        base_url=str(settings.ollama_base_url),
        model=settings.ollama_model,
        timeout_seconds=settings.request_timeout_seconds,
    )
    return DamageAnalyzerService(detector=detector, ollama_client=ollama)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.damage_service = _build_service()
    yield


app = FastAPI(title="VelAuto AI Microservice", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_damage_service() -> DamageAnalyzerService:
    service = getattr(app.state, "damage_service", None)
    if service is None:
        raise RuntimeError("DamageAnalyzerService baslatilmadi")
    return service


@app.post("/analyze-damage", response_model=AnalyzeDamageResponse)
async def analyze_damage(
    payload: AnalyzeDamageForm = Depends(AnalyzeDamageForm.as_form),
    image: UploadFile = File(...),
    service: DamageAnalyzerService = Depends(get_damage_service),
) -> AnalyzeDamageResponse:
    if image.content_type is None or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Yalnizca gorsel dosyasi yukleyebilirsiniz")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Yuklenen dosya bos")

    try:
        return await service.analyze(image_bytes=image_bytes, description=payload.description)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Analiz sirasinda hata: {exc}") from exc


@app.post("/analyze-text", response_model=AnalyzeTextResponse)
async def analyze_text(
    payload: AnalyzeTextForm = Depends(AnalyzeTextForm.as_form),
) -> AnalyzeTextResponse:
    try:
        report = await app.state.damage_service.ollama_client.generate_text_report(payload.description)
        return AnalyzeTextResponse(ai_analysis_report=report)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Metin analizi sirasinda hata: {exc}") from exc


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
