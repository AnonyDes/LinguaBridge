#!/usr/bin/env python3
"""
Downloads the 2.46 GB pytorch_model.bin for facebook/nllb-200-distilled-600M
with automatic retry, resume, and progress reporting.
"""
import sys
import io
import time
from pathlib import Path

# UTF-8 stdout
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from huggingface_hub import hf_hub_download

ROOT_DIR = Path(__file__).resolve().parents[1]
TARGET_DIR = ROOT_DIR / "models" / "nllb-200-distilled-600M"
TARGET_DIR.mkdir(parents=True, exist_ok=True)

REPO_ID = "facebook/nllb-200-distilled-600M"
FILENAME = "pytorch_model.bin"

print(f"📥 Démarrage du téléchargement des poids : {REPO_ID}/{FILENAME}", flush=True)
print(f"🎯 Destination : {TARGET_DIR}", flush=True)

for attempt in range(1, 10):
    try:
        print(f"🔄 Tentative {attempt}/10...", flush=True)
        path = hf_hub_download(
            repo_id=REPO_ID,
            filename=FILENAME,
            local_dir=str(TARGET_DIR),
            resume_download=True,
        )
        file_size_gb = Path(path).stat().st_size / (1024 ** 3)
        print(f"✅ Téléchargement réussi : {path} ({file_size_gb:.2f} Go)", flush=True)
        break
    except Exception as e:
        print(f"⚠️ Tentative {attempt} échouée ({e}). Reprise dans 5s...", flush=True)
        time.sleep(5)
