from typing import List

from fastapi import Form
from pydantic import BaseModel, Field, field_validator


class AnalyzeDamageForm(BaseModel):
    description: str = Field(..., min_length=5, max_length=2000)

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("description bos olamaz")
        return cleaned

    @classmethod
    def as_form(cls, description: str = Form(...)) -> "AnalyzeDamageForm":
        return cls(description=description)


class AnalyzeTextForm(BaseModel):
    description: str = Field(..., min_length=5, max_length=2000)

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("description bos olamaz")
        return cleaned

    @classmethod
    def as_form(cls, description: str = Form(...)) -> "AnalyzeTextForm":
        return cls(description=description)


class DamageDetection(BaseModel):
    label: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class AnalyzeDamageResponse(BaseModel):
    detected_damages: List[DamageDetection]
    ai_analysis_report: str


class AnalyzeTextResponse(BaseModel):
    ai_analysis_report: str
