# Cybow2AC inference service (FastAPI)

Separately deployed Python service that the web app calls at `POST /api/analyze`.
The web app reads its address from the `VITE_ANALYSIS_API_URL` build variable.

`helper.py` (supplied by the project owner) is the authoritative pipeline definition.
`app/pipeline.py` mirrors the specified stages and constants; if `helper.py` differs,
`helper.py` wins — reconcile before deploying.

## Private model assets (not in this repo)
Place in `weights/` (or set `WEIGHTS_DIR`):
- `yolov8m_custom3.pt`
- `Al_runs/run_019/best_checkpoint.pt`
- `Cr_runs/run_001/best_checkpoint.pt`

## Run
    pip install -r requirements.txt
    ALLOWED_ORIGINS=https://strip-scan-scout.lovable.app uvicorn app.main:app --host 0.0.0.0 --port 8000

## Test
    pytest
