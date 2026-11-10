import io, os, glob
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from app import main, pipeline as P

client = TestClient(main.app)

def png(w=400, h=600):
    b = io.BytesIO(); Image.new("RGB", (w, h), "white").save(b, "PNG"); return b.getvalue()

class Fake:
    def __init__(self, dets, al=30.0, cr=1000.0): self.dets, self.al, self.cr = dets, al, cr
    def run(self, img):
        pads = P.select_pads(self.dets)
        return {"albumin": self.al, "creatinine": self.cr, "conf": {k: v.confidence for k, v in pads.items()}}

GOOD = [P.Detection("albumin", 0.9, (0, 0, 10, 10)), P.Detection("creatinine", 0.8, (0, 20, 10, 30))]

@pytest.fixture(autouse=True)
def tmpdir(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "TEMP_DIR", str(tmp_path)); return tmp_path

def post(data, ctype="image/png"):
    return client.post("/api/analyze", files={"image": ("s.png", data, ctype)})

def test_exactly_one_pair_required():
    with pytest.raises(P.RetakeRequired): P.select_pads(GOOD[:1])
    with pytest.raises(P.RetakeRequired): P.select_pads(GOOD + [P.Detection("albumin", 0.7, (0, 0, 1, 1))])
    with pytest.raises(P.RetakeRequired): P.select_pads([GOOD[0], P.Detection("creatinine", 0.3, (0, 0, 1, 1))])
    assert set(P.select_pads(GOOD)) == {"albumin", "creatinine"}

def test_acr_and_nonpositive_creatinine():
    assert P.compute_acr(30, 1000) == pytest.approx(30)
    assert P.compute_acr(30, 0) is None and P.compute_acr(30, -1) is None

def test_complete(monkeypatch):
    monkeypatch.setattr(main, "get_pipeline", lambda: Fake(GOOD))
    r = post(png()).json()
    assert r["status"] == "complete" and r["acr"] == pytest.approx(30)

def test_zero_creatinine_is_error(monkeypatch):
    monkeypatch.setattr(main, "get_pipeline", lambda: Fake(GOOD, cr=0.0))
    r = post(png()).json()
    assert r["status"] == "error" and r["acr"] is None

def test_corrupt_and_oversized(monkeypatch):
    assert post(b"not an image").json()["status"] == "invalid_image"
    monkeypatch.setattr(main, "MAX_BYTES", 10)
    assert post(png()).json()["errorCode"] == "too_large"

def test_unavailable_model(monkeypatch):
    def boom(): raise RuntimeError("no weights")
    monkeypatch.setattr(main, "get_pipeline", boom)
    r = post(png())
    assert r.status_code == 503 and r.json()["status"] == "analysis_unavailable"

def test_temp_files_deleted(monkeypatch, tmpdir):
    monkeypatch.setattr(main, "get_pipeline", lambda: Fake(GOOD))
    post(png()); post(b"bad")
    assert glob.glob(os.path.join(str(tmpdir), "cybow_*")) == []
