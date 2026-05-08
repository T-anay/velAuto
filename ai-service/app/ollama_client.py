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
            "Yalnizca Turkce yaz. Cok kisa yaz. "
            "Tam olarak 3 satirlik formatta cevap ver."
        )

        payload = {
            "model": self.model,
            "prompt": user_prompt,
            "system": SYSTEM_PROMPT,
            "stream": False,
            "options": {"temperature": 0.2},
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
            "Bu metinden olasi araç arızasını veya hasar tipini çıkar. "
            "Yalnizca Turkce yaz. "
            "Ayni formatta, 3 kisa cumle ver. "
            "Birinci cumle tespit sonucunu, ikinci cumle cozum onerini, ucuncu cumle usta gorusunu icersin. "
            "Maddeleme, numaralandirma ve baslik kullanma."
        )

        payload = {
            "model": self.model,
            "prompt": user_prompt,
            "system": (
                "Sen VelAuto servis asistanısın. Cevap dili HER ZAMAN Turkce olacak. "
                "Sadece uc kisa cumle ver. Numaralandirma ve baslik kullanma. "
                "Birinci cumle tespit sonucunu, ikinci cumle cozum onerini, ucuncu cumle usta gorusunu icersin."
            ),
            "stream": False,
            "options": {"temperature": 0.2},
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(f"{self.base_url}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()

        raw = str(data.get("response", "")).strip()
        return self._normalize_text_report(raw)

    @staticmethod
    def _normalize_report(text: str) -> str:
        lines = [line.strip(" -\t") for line in text.replace("\r", "").split("\n") if line.strip()]
        if not lines:
            return "1) Kisa Ozet: Hasar ozeti alinmadi.\n2) Tahmini Islem: Gorsel kontrol tekrarlansin.\n3) Usta Notu: Araci serviste fiziksel inceleyin."

        compact = " ".join(lines)
        sentence_parts = [part.strip() for part in compact.split(".") if part.strip()]
        if not sentence_parts:
            sentence_parts = [compact]

        def clamp(value: str, max_len: int) -> str:
            return value if len(value) <= max_len else value[: max_len - 3].rstrip() + "..."

        s1 = clamp(sentence_parts[0], 90)
        s2 = clamp(sentence_parts[1] if len(sentence_parts) > 1 else "Onarim icin kaporta ve boya kontrolu yapin", 90)
        s3 = clamp(sentence_parts[2] if len(sentence_parts) > 2 else "Kesin karar icin usta fiziki kontrol yapsin", 90)

        return f"1) Kisa Ozet: {s1}\n2) Tahmini Islem: {s2}\n3) Usta Notu: {s3}"

    @staticmethod
    def _normalize_text_report(text: str) -> str:
        lines = [line.strip(" -\t") for line in text.replace("\r", "").split("\n") if line.strip()]
        if not lines:
            return "Hasar tespit edilemedi, usta incelemesi onerilir. Hasara uygun cozum icin teknik kontrol onerilir. Sonraki asamada usta gorusu ile detaylari girin."

        cleaned_lines = []
        for line in lines:
            cleaned = line
            cleaned = cleaned.lstrip("0123456789). ")
            cleaned = cleaned.replace("Kisa Ozet:", "").replace("Kısa Özet:", "")
            cleaned = cleaned.replace("Tahmini Islem:", "").replace("Tahmini İşlem:", "")
            cleaned = cleaned.replace("Usta Notu:", "")
            cleaned = cleaned.strip()
            if cleaned:
                cleaned_lines.append(cleaned)

        if cleaned_lines:
            lines = cleaned_lines

        compact = re.sub(r"\*+", "", " ".join(lines))
        compact = re.sub(r"\s+", " ", compact).strip()

        section_patterns = {
            "s1": [r"(?:Tespit Sonucu|Kisa Ozet|Kısa Özet|Ozeti|Özeti)\s*[:\-]\s*(.*?)(?=\s*(?:Çözüm Önerisi|Cozum Onerisi|Tahmini Islem|Tahmini İşlem|Usta Notu)\s*[:\-]|$)"],
            "s2": [r"(?:Çözüm Önerisi|Cozum Onerisi|Tahmini Islem|Tahmini İşlem|İşlem)\s*[:\-]\s*(.*?)(?=\s*(?:Usta Notu|Usta Gorusu|Usta Görüşü)\s*[:\-]|$)"],
            "s3": [r"(?:Usta Notu|Usta Gorusu|Usta Görüşü|Usta Gorusu)\s*[:\-]\s*(.*)$"],
        }

        extracted = {}
        for key, patterns in section_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, compact, flags=re.IGNORECASE)
                if match:
                    extracted[key] = match.group(1).strip()
                    break

        if extracted:
            s1 = extracted.get("s1") or "Hasar tespit edilemedi, usta incelemesi onerilir"
            s2 = extracted.get("s2") or "Hasara uygun cozum icin teknik kontrol onerilir"
            s3 = extracted.get("s3") or "Sonraki asamada usta gorusu ile detaylari girin"

            return f"{s1.rstrip('.')} . {s2.rstrip('.')} . {s3.rstrip('.')} .".replace(" .", ".")

        def clean_line(line: str) -> str:
            # Remove common prefixes and numbering
            prefixes = [
                "1)", "2)", "3)", 
                "Kisa Ozet:", "Kısa Özet:", "Kisa Ozeti:", "Kısa Özeti:",
                "Tahmini Islem:", "Tahmini İşlem:", "Islem:", "İşlem:",
                "Usta Notu:", "Usta Gorusu:", "Usta Görüşü:",
                "-", "*", ":"
            ]
            cleaned = line.strip()
            for p in prefixes:
                if cleaned.lower().startswith(p.lower()):
                    cleaned = cleaned[len(p):].strip()
            return cleaned

        cleaned_parts = [clean_line(p) for p in sentence_parts if clean_line(p)]
        if not cleaned_parts:
            cleaned_parts = [compact]

        def clamp(value: str, max_len: int) -> str:
            return value if len(value) <= max_len else value[: max_len - 3].rstrip() + "..."

        s1 = clamp(cleaned_parts[0], 100)
        s2 = clamp(cleaned_parts[1] if len(cleaned_parts) > 1 else "Hasara uygun cozum icin teknik kontrol onerilir", 100)
        s3 = clamp(cleaned_parts[2] if len(cleaned_parts) > 2 else "Sonraki asamada usta gorusu ile detaylari girin", 100)

        return f"1) Kisa Ozet: {s1}\n2) Tahmini Islem: {s2}\n3) Usta Notu: {s3}"
