from __future__ import annotations

from io import BytesIO
from typing import List

import numpy as np
import torch
from PIL import Image
from ultralytics import YOLO

from app.constants import DAMAGE_LABEL_TR_MAP
from app.schemas import DamageDetection


class YoloDamageDetector:
    def __init__(self, model_path: str, conf_threshold: float) -> None:
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.conf_threshold = conf_threshold
        self.model = YOLO(model_path)
        self.model.to(self.device)

    def detect(self, image_bytes: bytes) -> List[DamageDetection]:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)

        results = self.model.predict(
            source=image_np,
            device=0 if self.device.startswith("cuda") else "cpu",
            conf=self.conf_threshold,
            verbose=False,
        )

        detections: List[DamageDetection] = []
        for result in results:
            boxes = result.boxes
            if boxes is None or boxes.cls is None or boxes.conf is None:
                continue

            class_ids = boxes.cls.tolist()
            confidences = boxes.conf.tolist()
            names = result.names

            for class_id, conf in zip(class_ids, confidences):
                raw_label = str(names[int(class_id)]).strip().lower()
                tr_label = DAMAGE_LABEL_TR_MAP.get(raw_label, raw_label)
                detections.append(
                    DamageDetection(
                        label=tr_label,
                        confidence=round(float(conf), 4),
                    )
                )

        detections.sort(key=lambda item: item.confidence, reverse=True)
        return detections
