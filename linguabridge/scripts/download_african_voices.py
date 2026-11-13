#!/usr/bin/env python3
"""
LinguaBridge Sovereign African Live Voice Downloader
Downloads available Meta MMS VITS checkpoints for research only.
There is no verified facebook/mms-tts-ewo or facebook/mms-tts-knc repository.
facebook/mms-tts-pcm is Nigerian Pidgin, not Cameroon Pidgin.
The available Meta checkpoints have a CC-BY-NC-4.0 license.

Architecture: End-to-end VITS (Variational Inference with Adversarial Learning for End-to-End Text-to-Speech)
Checkpoint availability and voice quality must be verified before release.
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
MODELS_DIR = ROOT_DIR / "models" / "african-tts"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

SOVEREIGN_VOICES = [
    {
        "name": "Fulfulde",
        "code": "fuv-CM",
        "repo": "facebook/mms-tts-ful",
        "dir": MODELS_DIR / "mms-tts-ful",
        "region": "Grand-Nord / Adamaoua / Nord"
    },
    {
        "name": "Haoussa",
        "code": "hau-CM",
        "repo": "facebook/mms-tts-hau",
        "dir": MODELS_DIR / "mms-tts-hau",
        "region": "Grand-Nord / Carrefours Commerciaux"
    },
]

def format_size(size_bytes: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def get_dir_size(path: Path) -> int:
    if not path.exists():
        return 0
    return sum(p.stat().st_size for p in path.rglob('*') if p.is_file())

def download_voice(voice: dict):
    print(f"\n==================================================================", flush=True)
    print(f"🎙️  Téléchargement de la Voix Africaine : {voice['name']} [{voice['code']}]", flush=True)
    print(f"🌍  Région : {voice['region']}", flush=True)
    print(f"📦  Modèle Meta MMS VITS : {voice['repo']}", flush=True)
    print(f"📂  Cible : {voice['dir']}", flush=True)
    print(f"==================================================================", flush=True)

    try:
        from huggingface_hub import snapshot_download
        start_time = time.time()
        snapshot_download(
            repo_id=voice["repo"],
            local_dir=str(voice["dir"]),
        )
        duration = time.time() - start_time
        total_size = get_dir_size(voice["dir"])
        print(f"✅ Voix {voice['name']} téléchargée avec succès en {duration:.1f}s ({format_size(total_size)})", flush=True)
        return True
    except Exception as e:
        print(f"⚠️ Note : Téléchargement direct HuggingFace en attente réseau ({e})", flush=True)
        print("ℹ️ Cette voix reste indisponible tant qu'un modèle validé n'est pas installé.", flush=True)
        return False

def main():
    print("==================================================================")
    print("LINGUABRIDGE — RESEARCH-ONLY META MMS CHECKPOINTS")
    print("   Hausa and Fulfulde model files only; CC-BY-NC-4.0.")
    print("   Ewondo, Central Kanuri and Cameroon Pidgin voice models are not verified here.")
    print("==================================================================")

    results = []
    for voice in SOVEREIGN_VOICES:
        ok = download_voice(voice)
        results.append((voice["name"], voice["code"], ok))

    print("\n==================================================================")
    print("📊 RÉSUMÉ DES VOIX AFRICAINES CAMEROUNAISES :")
    for name, code, ok in results:
        status = "Fichiers téléchargés, validation requise" if ok else "Indisponible"
        print(f"  - {name} [{code}]: {status}")
    print("==================================================================")

if __name__ == "__main__":
    main()
