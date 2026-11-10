"""Fixed inference pipeline. Mirrors helper.py; helper.py is authoritative."""
from __future__ import annotations
import os
from dataclasses import dataclass
from typing import Optional

from PIL import Image

WEIGHTS_DIR = os.environ.get("WEIGHTS_DIR", os.path.join(os.path.dirname(__file__), "..", "weights"))
YOLO_PATH = "yolov8m_custom3.pt"
AL_CKPT = "Al_runs/run_019/best_checkpoint.pt"
CR_CKPT = "Cr_runs/run_001/best_checkpoint.pt"
CONF_THRESHOLD = 0.5
IOU_THRESHOLD = 0.7
AL_MEAN, AL_STD = 131.44553072625698, 136.77374925625233
CR_MEAN, CR_STD = 716.6666666666666, 643.9893028787219
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
CLASS_MAP = {"albumin": "albumin", "creatine": "creatinine", "creatinine": "creatinine"}


class RetakeRequired(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


@dataclass
class Detection:
    pad: str
    confidence: float
    box: tuple[int, int, int, int]


def select_pads(detections: list[Detection]) -> dict[str, Detection]:
    """Require exactly one credible albumin and one credible creatinine pad."""
    credible = [d for d in detections if d.confidence >= CONF_THRESHOLD]
    by_pad: dict[str, list[Detection]] = {"albumin": [], "creatinine": []}
    for d in credible:
        by_pad.setdefault(d.pad, []).append(d)
    if not by_pad["albumin"] or not by_pad["creatinine"]:
        raise RetakeRequired("pads_missing", "Both pads could not be found clearly.")
    if len(by_pad["albumin"]) > 1 or len(by_pad["creatinine"]) > 1:
        raise RetakeRequired("multiple_strips", "More than one strip may be in the photo.")
    return {"albumin": by_pad["albumin"][0], "creatinine": by_pad["creatinine"][0]}


def compute_acr(albumin_mg_l: float, creatinine_mg_l: float) -> Optional[float]:
    if creatinine_mg_l is None or creatinine_mg_l <= 0:
        return None
    return (albumin_mg_l / creatinine_mg_l) * 1000


def inverse_standardize(y: float, mean: float, std: float) -> float:
    return y * std + mean


class Pipeline:
    def __init__(self) -> None:
        import torch, timm  # noqa: E401
        from ultralytics import YOLO
        self.torch = torch
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.yolo = YOLO(os.path.join(WEIGHTS_DIR, YOLO_PATH))
        self.al = self._load_regressor(os.path.join(WEIGHTS_DIR, AL_CKPT))
        self.cr = self._load_regressor(os.path.join(WEIGHTS_DIR, CR_CKPT))

    def _load_regressor(self, path: str):
        import timm
        torch = self.torch

        class Regressor(torch.nn.Module):
            def __init__(self):
                super().__init__()
                self.backbone = timm.create_model("convnext_tiny", pretrained=False, num_classes=0)
                self.head = torch.nn.Linear(self.backbone.num_features, 1)

            def forward(self, x):
                return self.head(self.backbone(x)).squeeze(-1)

        m = Regressor()
        ckpt = torch.load(path, map_location=self.device)
        m.load_state_dict(ckpt.get("model_state_dict", ckpt))
        return m.to(self.device).eval()

    def _tensor(self, crop: Image.Image):
        import torchvision.transforms.functional as F
        t = F.to_tensor(crop.convert("RGB"))
        return F.normalize(t, IMAGENET_MEAN, IMAGENET_STD).unsqueeze(0).to(self.device)

    def detect(self, img: Image.Image) -> list[Detection]:
        res = self.yolo.predict(img, conf=CONF_THRESHOLD, iou=IOU_THRESHOLD, verbose=False)[0]
        out = []
        for b in res.boxes:
            name = res.names[int(b.cls)]
            pad = CLASS_MAP.get(name)
            if pad:
                x1, y1, x2, y2 = (int(v) for v in b.xyxy[0].tolist())
                out.append(Detection(pad, float(b.conf), (x1, y1, x2, y2)))
        return out

    def run(self, img: Image.Image) -> dict:
        pads = select_pads(self.detect(img))
        with self.torch.no_grad():
            al = inverse_standardize(float(self.al(self._tensor(img.crop(pads["albumin"].box)))), AL_MEAN, AL_STD)
            cr = inverse_standardize(float(self.cr(self._tensor(img.crop(pads["creatinine"].box)))), CR_MEAN, CR_STD)
        return {"albumin": al, "creatinine": cr, "conf": {k: v.confidence for k, v in pads.items()}}
