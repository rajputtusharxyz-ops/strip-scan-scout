from __future__ import annotations
import io, os, tempfile, logging
from datetime import datetime, timezone

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps, UnidentifiedImageError

from .schemas import AnalyzeResponse, DetectionConfidence, Status
from . import pipeline as P

log = logging.getLogger("inference")  # never log images, crops or concentrations
BUILD = os.environ.get("ANALYSIS_BUILD", "cybow2ac-1")
MAX_BYTES = int(os.environ.get("MAX_UPLOAD_BYTES", 12 * 1024 * 1024))
MAX_PIXELS = 40_000_000
MIN_SIDE = 200
ALLOWED = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp", "image/tiff", "image/heic", "image/heif"}

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:  # pragma: no cover
    pass

app = FastAPI(title="Cybow2AC inference service")
app.add_middleware(CORSMiddleware, allow_origins=[o for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o], allow_methods=["POST"], allow_headers=["*"])

_pipeline = None
def get_pipeline():
    global _pipeline
    if _pipeline is None:
        _pipeline = P.Pipeline()
    return _pipeline

TEMP_DIR = tempfile.gettempdir()

def now() -> str:
    return datetime.now(timezone.utc).isoformat()

def reply(status: Status, http: int = 200, **kw) -> JSONResponse:
    body = AnalyzeResponse(status=status, capturedAt=now(), analysisBuild=BUILD, **kw)
    return JSONResponse(body.model_dump(), status_code=http)


@app.post("/api/analyze")
async def analyze(image: UploadFile = File(...)):
    if (image.content_type or "").lower() not in ALLOWED:
        return reply(Status.invalid_image, 415, errorCode="unsupported_type", message="This file type is not supported.")
    data = await image.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        return reply(Status.invalid_image, 413, errorCode="too_large", message="This photo is too large.")
    tmp = tempfile.NamedTemporaryFile(delete=False, dir=TEMP_DIR, prefix="cybow_", suffix=".img")
    try:
        tmp.write(data); tmp.close()
        try:
            Image.MAX_IMAGE_PIXELS = MAX_PIXELS
            with Image.open(tmp.name) as im:
                im.verify()
            with Image.open(tmp.name) as im:
                img = ImageOps.exif_transpose(im).convert("RGB")
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError, SyntaxError):
            return reply(Status.invalid_image, 400, errorCode="corrupt", message="This image could not be read.")
        if min(img.size) < MIN_SIDE:
            return reply(Status.invalid_image, 400, errorCode="too_small", message="This photo is too small.")
        try:
            pipe = get_pipeline()
        except Exception:
            log.exception("model load failed")
            return reply(Status.analysis_unavailable, 503, errorCode="model_unavailable", message="The analysis service is unavailable.")
        try:
            out = pipe.run(img)
        except P.RetakeRequired as e:
            return reply(Status.retake_required, errorCode=e.code, message=str(e))
        acr = P.compute_acr(out["albumin"], out["creatinine"])
        conf = DetectionConfidence(**out["conf"])
        if acr is None:
            return reply(Status.error, errorCode="invalid_creatinine", message="The creatinine estimate was zero or below.", detectionConfidence=conf)
        return reply(Status.complete, albuminMgL=out["albumin"], creatinineMgL=out["creatinine"], acr=acr, detectionConfidence=conf)
    except Exception:
        log.exception("analysis failed")
        return reply(Status.error, 500, errorCode="internal", message="Something went wrong during analysis.")
    finally:
        try: os.unlink(tmp.name)
        except FileNotFoundError: pass
