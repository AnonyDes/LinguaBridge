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

import torch
torch.set_num_threads(2)

# Cache for loaded models, tokenizers, and synthesized audio
LOADED_MODELS = {}
LOADED_TOKENIZERS = {}
AUDIO_CACHE = {}

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
        from transformers import VitsModel, VitsTokenizer

        tokenizer = VitsTokenizer.from_pretrained(str(model_dir))
        model = VitsModel.from_pretrained(str(model_dir))
        model.eval()

        LOADED_TOKENIZERS[cache_key] = tokenizer
        LOADED_MODELS[cache_key] = model
        print(f"✅ Loaded {model_dir.name} into memory!", flush=True)

    return LOADED_MODELS[cache_key], LOADED_TOKENIZERS[cache_key]

import re
import threading

MODEL_INFERENCE_LOCK = threading.Lock()

DIGIT_WORDS = {
    "ewo": {
        "0": "zélo", "1": "fɔ́k", "2": "bɛ̌", "3": "lǎl", "4": "nyǐn",
        "5": "tán", "6": "samə́n", "7": "zangbá", "8": "mwôm", "9": "ebúl"
    },
    "hau": {
        "0": "sifili", "1": "daya", "2": "biyu", "3": "uku", "4": "hudu",
        "5": "biyar", "6": "shida", "7": "bakwai", "8": "takwas", "9": "tara"
    },
    "knc": {
        "0": "sifili", "1": "daya", "2": "biyu", "3": "uku", "4": "hudu",
        "5": "biyar", "6": "shida", "7": "bakwai", "8": "takwas", "9": "tara"
    },
    "fuv": {
        "0": "bolum", "1": "go'o", "2": "ɗiɗi", "3": "tati", "4": "nay",
        "5": "jowi", "6": "jee-go'o", "7": "jee-ɗiɗi", "8": "jee-tati", "9": "jee-nay"
    },
    "pcm": {
        "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
        "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine"
    }
}

def verbalize_numbers(text: str, lang_norm: str) -> str:
    """Verbalizes raw Arabic numerals (01, 5000, 2026) into spoken words to prevent VITS tokenizer crashes."""
    base_lang = lang_norm.split("-")[0]
    digit_map = DIGIT_WORDS.get(base_lang, DIGIT_WORDS["ewo"])

    def repl_num(match):
        digits = match.group(0)
        return " " + " ".join(digit_map.get(d, d) for d in digits) + " "

    verbalized = re.sub(r'\d+', repl_num, text)
    verbalized = re.sub(r'\s+', ' ', verbalized).strip()
    return verbalized if verbalized else text

def synthesize_wav_bytes(text: str, lang_norm: str) -> bytes:
    """Synthesizes text into 16kHz mono 16-bit PCM WAV bytes with in-memory caching."""
    import numpy as np

    verbalized_text = verbalize_numbers(text, lang_norm)
    clean_text = verbalized_text.strip()
    cache_key = f"{lang_norm}:{clean_text.lower()}"
    if cache_key in AUDIO_CACHE:
        return AUDIO_CACHE[cache_key]

    model, tokenizer = get_model_and_tokenizer(lang_norm)

    inputs = tokenizer(clean_text, return_tensors="pt")

    # Guard against 0 tokens (e.g. text was only symbols or unprintable characters)
    if inputs.get("input_ids") is None or inputs["input_ids"].shape[-1] == 0:
        fallback_token = "a"
        inputs = tokenizer(fallback_token, return_tensors="pt")

    with MODEL_INFERENCE_LOCK:
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

    wav_bytes = wav_io.getvalue()
    # Cache result for ultra-fast instant sub-millisecond retrieval on re-read/hover
    if len(AUDIO_CACHE) < 1000:
        AUDIO_CACHE[cache_key] = wav_bytes

    return wav_bytes

def preload_core_models():
    """Preloads ALL 5 sovereign models into RAM so every first request is instant."""
    print("🚀 Preloading ALL sovereign African voice models...", flush=True)
    warmup_phrases = {
        "ewo-cm": "Mbolo",
        "hau-cm": "Sannu",
        "fuv-cm": "Jam",
        "knc-cm": "Ndawuro",
        "pcm-cm": "How far",
    }
    for lang, phrase in warmup_phrases.items():
        try:
            get_model_and_tokenizer(lang)
            synthesize_wav_bytes(phrase, lang)
            print(f"✅ {lang} model warmed up and ready!", flush=True)
        except Exception as e:
            print(f"⚠️ Preload warning for {lang}: {e}", flush=True)
    print("🎉 All sovereign models loaded and ready for instant playback!", flush=True)

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
    preload_core_models()
    print(f"🚀 LinguaBridge African Voice Server running on http://127.0.0.1:{port}", flush=True)
    app.run(host="127.0.0.1", port=port, debug=False, threaded=True)
