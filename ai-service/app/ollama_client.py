from __future__ import annotations

import re

import httpx

from app.constants import SYSTEM_PROMPT


class OllamaClient:
    def __init__(self, base_url: str, model: str, timeout_seconds: int) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds

    async def generate_report(self, detected_damages_text: str, customer_description: str) -> str:
        user_prompt = (
            f"Tespit Edilen Hasarlar: [{detected_damages_text}], "
            f"Müşteri Şikayeti: [{customer_description}]. "
            "Lütfen sistem talimatlarına uygun olarak analiz et."
        )

        payload = {
            "model": self.model,
            "prompt": user_prompt,
            "system": SYSTEM_PROMPT,
            "stream": False,
            "options": {"temperature": 0.4, "num_predict": 500, "repeat_penalty": 1.1, "top_k": 40},
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(f"{self.base_url}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()

        raw = str(data.get("response", "")).strip()
        return self._normalize_report(raw)

    async def generate_text_report(self, customer_description: str) -> str:
        user_prompt = (
            f"Müşteri Şikayeti: [{customer_description}]. "
            "Lütfen farklı mekanik sistemleri (elektrik, ateşleme, yakıt, mekanik) değerlendirerek, "
            "sistem talimatlarına uygun olarak 3 farklı ihtimal içeren detaylı bir arıza teşhisi yap."
        )

        payload = {
            "model": self.model,
            "prompt": user_prompt,
            "system": SYSTEM_PROMPT,
            "stream": False,
            "options": {"temperature": 0.4, "num_predict": 500, "repeat_penalty": 1.1, "top_k": 40},
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(f"{self.base_url}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()

        raw = str(data.get("response", "")).strip()
        return self._normalize_text_report(raw)

    @staticmethod
    def _clamp(value: str, max_len: int) -> str:
        return value if len(value) <= max_len else value[: max_len - 3].rstrip() + "..."

    def _normalize_report(self, text: str) -> str:
        # For image reports, we still try to keep it relatively clean but adapt to new labels
        lines = [line.strip() for line in text.replace("\r", "").split("\n") if line.strip()]
        if not lines:
            return (
                "1) Arıza Teşhisleri (Olasılık Sırasıyla): Arıza tespit edilemedi.\n"
                "2) Tahmini İşlem: Teknik kontrol gereklidir.\n"
                "3) Usta Notu: Aracı servise getirin."
            )

        compact = " ".join(lines)
        section_patterns = {
            "s1": [r"(?:Arıza Teşhisleri|Arıza Teşhisi|Ariza Teshisi|Tespit Sonucu|Kisa Ozet|Kısa Özet)\s*(?:\(Olasılık Sırasıyla\))?\s*[:\-]\s*(.*?)(?=\s*(?:2\)|Tahmini İşlem|Tahmini Islem|İşlem|Çözüm Önerisi|Cozum Onerisi|Usta Notu)\s*[:\-]|$)"],
            "s2": [r"(?:Tahmini İşlem|Tahmini Islem|İşlem|Çözüm Önerisi|Cozum Onerisi)\s*[:\-]\s*(.*?)(?=\s*(?:3\)|Usta Notu|Usta Gorusu|Usta Görüşü)\s*[:\-]|$)"],
            "s3": [r"(?:Usta Notu|Usta Gorusu|Usta Görüşü)\s*[:\-]\s*(.*)$"],
        }

        extracted = {}
        for key, patterns in section_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, compact, flags=re.IGNORECASE)
                if match:
                    extracted[key] = match.group(1).strip()
                    break

        s1 = extracted.get("s1") or "Hasar tespiti yapılamadı"
        s2 = extracted.get("s2") or "Gerekli kontrollerin yapılması önerilir"
        s3 = extracted.get("s3") or "Arıza ilerlemeden servise başvurun"

        return f"1) Arıza Teşhisleri (Olasılık Sırasıyla): {s1}\n2) Tahmini İşlem: {s2}\n3) Usta Notu: {s3}"

    def _normalize_text_report(self, text: str) -> str:
        # Preserve lines for the list structure in text reports
        lines = [line.strip() for line in text.replace("\r", "").split("\n") if line.strip()]
        if not lines:
            return (
                "1) Arıza Teşhisleri (Olasılık Sırasıyla): Belirtiler analiz edilemedi.\n"
                "2) Tahmini İşlem: Detaylı mekanik kontrol önerilir.\n"
                "3) Usta Notu: Arıza riskine karşı en kısa sürede kontrol ettirin."
            )

        full_text = "\n".join(lines)

        # Regex to split into the 3 main sections, preserving internal newlines
        # We handle both "Arıza Teşhisi" and "Arıza Teşhisleri" and optional "1)" prefix
        s1_pattern = r"(?:1\)\s*)?(?:Arıza Teşhisleri|Arıza Teşhisi|Ariza Teshisleri|Ariza Teshisi|Tespit Sonucu).*?[:\-]\s*(.*?)(?=\n\s*(?:2\)|Tahmini İşlem|Tahmini Islem)|$)"
        s2_pattern = r"(?:2\)\s*)?(?:Tahmini İşlem|Tahmini Islem|İşlem).*?[:\-]\s*(.*?)(?=\n\s*(?:3\)|Usta Notu|Usta Gorusu)|$)"
        s3_pattern = r"(?:3\)\s*)?(?:Usta Notu|Usta Gorusu|Usta Görüşü).*?[:\-]\s*(.*)$"

        s1_match = re.search(s1_pattern, full_text, re.DOTALL | re.IGNORECASE)
        s2_match = re.search(s2_pattern, full_text, re.DOTALL | re.IGNORECASE)
        s3_match = re.search(s3_pattern, full_text, re.DOTALL | re.IGNORECASE)

        s1 = s1_match.group(1).strip() if s1_match else ""
        s2 = s2_match.group(1).strip() if s2_match else ""
        s3 = s3_match.group(1).strip() if s3_match else ""

        # Fallback if regex fails - try a simpler split
        if not s1 or not s2:
            parts = re.split(r"\n\s*\d+\)\s*", full_text)
            if len(parts) >= 4: # split will include the part before "1)"
                s1 = s1 or parts[1].strip()
                s2 = s2 or parts[2].strip()
                s3 = s3 or parts[3].strip()
            elif len(parts) == 3:
                s1 = s1 or parts[1].strip()
                s2 = s2 or parts[2].strip()

        # If still nothing, use clamp on the whole thing but with higher limit
        if not s1:
            s1 = self._clamp(full_text, 500)
            s2 = s2 or "Detaylı teknik kontrol yapılması önerilir."
            s3 = s3 or "Arızanın ilerlemesi durumunda maliyet artabilir, servise başvurun."

        def clean_artifact(val: str) -> str:
            # Remove brackets and placeholder-like phrases the AI sometimes repeats
            val = re.sub(r"\[.*?\]", "", val)
            val = val.replace("Burada nokta atışı parça adını ve nedenini yaz", "")
            val = val.replace("En güçlü ihtimal için yapılacak ilk müdahale", "")
            val = val.replace("Kritik güvenlik veya maliyet uyarısı", "")
            val = val.replace("Müdahale detayını yaz", "")
            val = val.replace("Güvenlik uyarısını yaz", "")
            return val.strip()

        s1 = clean_artifact(s1)
        s2 = clean_artifact(s2)
        s3 = clean_artifact(s3)

        return (
            f"1) Arıza Teşhisleri (Olasılık Sırasıyla):\n{s1}\n"
            f"2) Tahmini İşlem: {s2}\n"
            f"3) Usta Notu: {s3}"
        )
