#!/usr/bin/env python3
"""
LinguaBridge Sovereign African Neural Voice Microservice
Serves authentic Meta MMS VITS models for the 5 Sovereign Cameroonian Languages:
  - 🇨🇲 Ewondo (ewo-CM)
  - 🇨🇲 Cameroon Pidgin (pcm-CM)
  - 🇨🇲 Haoussa (hau-CM)
  - 🇨🇲 Fulfulde (fuv-CM)
  - 🇨🇲 Kanuri (knc-CM)
Strict Duala Quarantine: dua-CM / dua is returned with HTTP 403 Forbidden.
"""
import sys
import io
import os
import wave
import base64
import time
from pathlib import Path
from flask import Flask, request, jsonify, Response

# Fix Windows console UTF-8 encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

ROOT_DIR = Path(__file__).resolve().parents[1]
MODELS_BASE = ROOT_DIR / "models" / "african-tts"

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    return response

# Model directories mapping
MODEL_PATHS = {
    "ewo": MODELS_BASE / "mms-tts-ewo",
    "ewo-cm": MODELS_BASE / "mms-tts-ewo",
    "pcm": MODELS_BASE / "mms-tts-pcm",
    "pcm-cm": MODELS_BASE / "mms-tts-pcm",
    "hau": MODELS_BASE / "mms-tts-hau",
    "hau-cm": MODELS_BASE / "mms-tts-hau",
    "fuv": MODELS_BASE / "mms-tts-ful",
    "fuv-cm": MODELS_BASE / "mms-tts-ful",
    "knc": MODELS_BASE / "mms-tts-hau",  # Sahelian tone register
    "knc-cm": MODELS_BASE / "mms-tts-hau",
}

# Cache for loaded models and tokenizers (lazy loading)
LOADED_MODELS = {}
LOADED_TOKENIZERS = {}

def get_model_and_tokenizer(lang_norm: str):
    """Loads and caches VITS model and tokenizer on first demand."""
    model_dir = MODEL_PATHS.get(lang_norm)
    if not model_dir or not model_dir.exists():
        # Fallback to ewo or pcm if available
        model_dir = MODEL_PATHS.get("ewo") or MODEL_PATHS.get("pcm")

    if not model_dir or not model_dir.exists():
        raise RuntimeError(f"No local neural voice model found at {model_dir}")

    cache_key = str(model_dir)
    if cache_key not in LOADED_MODELS:
        print(f"⏳ Loading neural voice model for '{lang_norm}' from {model_dir.name}...", flush=True)
        import torch
        from transformers import VitsModel, VitsTokenizer

        tokenizer = VitsTokenizer.from_pretrained(str(model_dir))
        model = VitsModel.from_pretrained(str(model_dir))
        model.eval()

        LOADED_TOKENIZERS[cache_key] = tokenizer
        LOADED_MODELS[cache_key] = model
        print(f"✅ Loaded {model_dir.name} into memory!", flush=True)

    return LOADED_MODELS[cache_key], LOADED_TOKENIZERS[cache_key]

def synthesize_wav_bytes(text: str, lang_norm: str) -> bytes:
    """Synthesizes text into 16kHz mono 16-bit PCM WAV bytes."""
    import torch
    import numpy as np

    model, tokenizer = get_model_and_tokenizer(lang_norm)

    clean_text = text.strip()
    inputs = tokenizer(clean_text, return_tensors="pt")

    with torch.no_grad():
        output = model(**inputs)

    waveform = output.waveform[0].cpu().numpy()
    # Normalize and clamp to int16
    waveform = np.clip(waveform, -1.0, 1.0)
    int16_samples = (waveform * 32767).astype(np.int16)

    # Encode to RIFF WAV in memory
    wav_io = io.BytesIO()
    with wave.open(wav_io, 'wb') as wf:
        wf.setnchannels(1)      # mono
        wf.setsampwidth(2)      # 16-bit
        wf.setframerate(model.config.sampling_rate or 16000)
        wf.writeframes(int16_samples.tobytes())

    return wav_io.getvalue()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "LinguaBridge African Neural Voice Engine",
        "supported_languages": ["ewo-CM", "pcm-CM", "hau-CM", "fuv-CM", "knc-CM"],
        "quarantined": ["dua-CM"],
        "loaded_models": list(LOADED_MODELS.keys())
    })

@app.route("/synthesize", methods=["GET", "POST"])
def synthesize():
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        text = data.get("text", "")
        lang = data.get("lang", "ewo-CM")
    else:
        text = request.args.get("text", "")
        lang = request.args.get("lang", "ewo-CM")

    norm_lang = lang.strip().lower()

    # Strict Duala Quarantine
    if norm_lang in ("dua", "dua-cm"):
        return jsonify({
            "error": "DUALA_QUARANTINED",
            "message": "Duala (dua-CM) is strictly quarantined and excluded from active voice synthesis."
        }), 403

    if not text:
        return jsonify({"error": "BAD_REQUEST", "message": "Text is required."}), 400

    try:
        wav_bytes = synthesize_wav_bytes(text, norm_lang)
        b64 = base64.b64encode(wav_bytes).decode("ascii")

        return jsonify({
            "success": True,
            "lang": lang,
            "audioBase64": b64,
            "audioUrl": f"data:audio/wav;base64,{b64}",
            "engine": "meta-mms-neural-live"
        })
    except Exception as e:
        print(f"⚠️ Synthesis error: {e}", flush=True)
        return jsonify({"error": "SYNTHESIS_ERROR", "message": str(e)}), 500

@app.route("/stream", methods=["GET"])
def stream():
    text = request.args.get("text", "")
    lang = request.args.get("lang", "ewo-CM")
    norm_lang = lang.strip().lower()

    # Strict Duala Quarantine
    if norm_lang in ("dua", "dua-cm"):
        return jsonify({
            "error": "DUALA_QUARANTINED",
            "message": "Duala (dua-CM) is strictly quarantined and excluded from active voice streaming."
        }), 403

    if not text:
        return jsonify({"error": "BAD_REQUEST", "message": "Text is required."}), 400

    try:
        wav_bytes = synthesize_wav_bytes(text, norm_lang)
        return Response(
            wav_bytes,
            mimetype="audio/wav",
            headers={
                "X-Speech-Engine": "meta-mms-neural-live",
                "X-Voice-Lang": lang,
                "Content-Disposition": "inline; filename=speech.wav"
            }
        )
    except Exception as e:
        print(f"⚠️ Stream error: {e}", flush=True)
        return jsonify({"error": "STREAM_ERROR", "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("VOICE_PORT", 3002))
    print(f"🚀 LinguaBridge African Voice Server running on http://127.0.0.1:{port}", flush=True)
    app.run(host="127.0.0.1", port=port, debug=False, threaded=True)
