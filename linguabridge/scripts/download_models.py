#!/usr/bin/env python3
"""
LinguaBridge Model Downloader
Downloads Meta NLLB-200 (600M translation) and Meta MMS-TTS (Ewondo VITS audio)
directly from Hugging Face into the local workspace for 100% offline execution.
"""
import os
import sys
import time
import io
from pathlib import Path

# Fix Windows console UTF-8 encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

ROOT_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

NLLB_REPO = "facebook/nllb-200-distilled-600M"
NLLB_TARGET = MODELS_DIR / "nllb-200-distilled-600M"

MMS_REPO = "facebook/mms-tts-ewo"
MMS_TARGET = MODELS_DIR / "mms-tts-ewo"

def format_size(size_bytes: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def get_dir_size(path: Path) -> int:
    total = 0
    if not path.exists():
        return 0
    for p in path.rglob('*'):
        if p.is_file():
            total += p.stat().st_size
    return total

def download_repo(repo_id: str, target_dir: Path, allow_patterns=None):
    from huggingface_hub import snapshot_download
    print(f"\n=======================================================", flush=True)
    print(f"[DOWNLOAD] Demarrage du telechargement : {repo_id}", flush=True)
    print(f"[TARGET] Dossier cible : {target_dir}", flush=True)
    print(f"=======================================================", flush=True)
    
    start_time = time.time()
    downloaded_path = snapshot_download(
        repo_id=repo_id,
        local_dir=str(target_dir),
        allow_patterns=allow_patterns,
        resume_download=True,
    )
    duration = time.time() - start_time
    total_size = get_dir_size(target_dir)
    print(f"[OK] Telechargement termine pour {repo_id} !", flush=True)
    print(f"[SIZE] Taille sur disque : {format_size(total_size)}", flush=True)
    print(f"[TIME] Duree : {duration:.1f} secondes\n", flush=True)
    return downloaded_path

def main():
    print("LINGUABRIDGE LOCAL AI MODELS DOWNLOADER", flush=True)
    print(f"Repertoire des modeles : {MODELS_DIR}", flush=True)

    # 1. Download Meta MMS-TTS Ewondo first (~145 Mo, quick to download & test)
    try:
        download_repo(MMS_REPO, MMS_TARGET)
    except Exception as e:
        print(f"[WARN] Erreur telechargement MMS-TTS Ewondo : {e}", file=sys.stderr, flush=True)

    # 2. Download Meta NLLB-200 Distilled 600M (Translation Engine: ~2.4 Go)
    nllb_patterns = [
        "config.json",
        "generation_config.json",
        "model.safetensors",
        "sentencepiece.bpe.model",
        "special_tokens_map.json",
        "tokenizer_config.json",
        "tokenizer.json"
    ]
    try:
        download_repo(NLLB_REPO, NLLB_TARGET, allow_patterns=nllb_patterns)
    except Exception as e:
        print(f"[WARN] Erreur telechargement NLLB-200 : {e}", file=sys.stderr, flush=True)

    print("\nTOUS LES MODELES ONT ETE TRAITES !", flush=True)
    print(f"* Traducteur NLLB-200 : {NLLB_TARGET} ({format_size(get_dir_size(NLLB_TARGET))})", flush=True)
    print(f"* Synthetiseur MMS-TTS : {MMS_TARGET} ({format_size(get_dir_size(MMS_TARGET))})", flush=True)

if __name__ == "__main__":
    main()
