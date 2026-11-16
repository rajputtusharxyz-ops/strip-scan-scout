"""Download the three model files from Google Drive into weights/.

Usage:  pip install gdown && python download_weights.py
"""
import os
import gdown

FILES = {
    "crop_model.pt": "1wSA5V8z3uLu38AIGp_eE3KCjz_OrB4va",
    "al_model.pt": "1fxQrUvIasZgABjagLONEA5O4G4XfBV-b",
    "cr_model.pt": "1rLaLjTciMcLwTm0slpOGg-XoK8xUs8D5",
}

weights_dir = os.environ.get("WEIGHTS_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "weights"))
os.makedirs(weights_dir, exist_ok=True)
for name, file_id in FILES.items():
    out = os.path.join(weights_dir, name)
    if os.path.exists(out):
        print(f"{name} already present, skipping")
        continue
    gdown.download(id=file_id, output=out, quiet=False)
print("Done:", weights_dir)
