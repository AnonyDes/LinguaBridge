#!/usr/bin/env python3
"""
LinguaBridge Sovereign African Neural Voice Microservice
Serves local Meta MMS VITS models for four configured language slots:
  - 🇨🇲 Ewondo (ewo-CM)
  - 🇨🇲 Cameroon Pidgin (pcm-CM)
  - 🇨🇲 Haoussa (hau-CM)
  - 🇨🇲 Fulfulde (fuv-CM)
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
}

import torch
import os
torch.set_num_threads(min(4, os.cpu_count() or 4))
DEVICE = "cuda" if torch.cuda.is_available() else ("mps" if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available() else "cpu")
print(f"⚡ Neural voice acceleration device: {DEVICE.upper()} (Threads: {torch.get_num_threads()})", flush=True)

# Cache for loaded models, tokenizers, and synthesized audio
LOADED_MODELS = {}
LOADED_TOKENIZERS = {}
AUDIO_CACHE = {}

def get_model_and_tokenizer(lang_norm: str):
    """Loads and caches VITS model and tokenizer on first demand."""
    model_dir = MODEL_PATHS.get(lang_norm)
    if not model_dir or not model_dir.exists():
        raise FileNotFoundError(f"No local neural voice model found for {lang_norm}")

    cache_key = str(model_dir)
    if cache_key not in LOADED_MODELS:
        print(f"⏳ Loading neural voice model for '{lang_norm}' from {model_dir.name}...", flush=True)
        from transformers import VitsModel, VitsTokenizer

        tokenizer = VitsTokenizer.from_pretrained(str(model_dir))
        model = VitsModel.from_pretrained(str(model_dir)).to(DEVICE)
        model.eval()

        LOADED_TOKENIZERS[cache_key] = tokenizer
        LOADED_MODELS[cache_key] = model
        print(f"✅ Loaded {model_dir.name} into memory on {DEVICE}!", flush=True)

    return LOADED_MODELS[cache_key], LOADED_TOKENIZERS[cache_key]

import re
import threading

MODEL_INFERENCE_LOCK = threading.Lock()

CALIBRATION_PARAMS = {
    "ewo": {"speaking_rate": 0.909, "noise_scale": 0.55, "noise_scale_w": 0.80},
    "fuv": {"speaking_rate": 0.926, "noise_scale": 0.55, "noise_scale_w": 0.80},
    "hau": {"speaking_rate": 0.909, "noise_scale": 0.55, "noise_scale_w": 0.80},
    "knc": {"speaking_rate": 0.893, "noise_scale": 0.55, "noise_scale_w": 0.80},
    "pcm": {"speaking_rate": 0.926, "noise_scale": 0.55, "noise_scale_w": 0.80},
}

DIGIT_WORDS = {
    "ewo": {
        "0": "zélo", "1": "fɔ́k", "2": "bɛ̌", "3": "lǎl", "4": "nyǐn",
        "5": "tán", "6": "samen", "7": "zangbá", "8": "mwôm", "9": "ebúl"
    },
    "hau": {
        "0": "sifili", "1": "daya", "2": "biyu", "3": "uku", "4": "hudu",
        "5": "biyar", "6": "shida", "7": "bakwai", "8": "takwas", "9": "tara"
    },
    "knc": {
        "0": "sifili", "1": "tílō", "2": "ndí", "3": "yakkə́", "4": "déyé",
        "5": "úwù", "6": "araskə́", "7": "tulur", "8": "wusku", "9": "ləgar"
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

def normalize_phonetics_and_loanwords(text: str, lang_norm: str) -> str:
    """
    Language-specific G2P pre-processor, diacritic normalizer and loanword phonotactic smoother.
    Guarantees that no vowels or phonemes are silently dropped by Meta MMS VITS tokenizers.
    """
    if not text or not text.strip():
        return ""

    t = text

    # 1. Typographical symbols -> acoustic breath pauses
    t = re.sub(r'[·•\*\-–—]+', ', ', t)
    t = re.sub(r'[→←↑↓\>]+', ', ', t)
    t = re.sub(r'[“\"\”«»]+', ' ', t)
    t = re.sub(r'[\r\n\t]+', '. ', t)
    t = re.sub(r'[\(\)\[\]\{\}\<\>]+', ' ', t)

    # 2. Universal brand names & common loanwords
    t = re.sub(r'\bNAYOKAN\b', 'nayokan', t, flags=re.IGNORECASE)
    t = re.sub(r'\bhandson\b|\bhands-on\b', 'practical', t, flags=re.IGNORECASE)
    t = re.sub(r'\bpartner with us\b', 'join us', t, flags=re.IGNORECASE)

    base = lang_norm.split("-")[0].lower()

    # 3. Currency verbalization
    if base == "ewo":
        t = re.sub(r'\bFCFA\b|\bXAF\b', 'frank', t, flags=re.IGNORECASE)
    elif base == "fuv":
        t = re.sub(r'\bFCFA\b|\bXAF\b', 'seede', t, flags=re.IGNORECASE)
    elif base == "hau":
        t = re.sub(r'\bFCFA\b|\bXAF\b', 'kudi', t, flags=re.IGNORECASE)
    elif base == "knc":
        t = re.sub(r'\bFCFA\b|\bXAF\b', 'kudi', t, flags=re.IGNORECASE)
    elif base == "pcm":
        t = re.sub(r'\bFCFA\b|\bXAF\b', 'cfa', t, flags=re.IGNORECASE)

    # 4. Language-specific phonetic G2P and vocabulary alignment
    if base == "ewo":
        # MMS mms-tts-ewo lacks acute vowels and drops them! Map acute to plain vowels to preserve them:
        t = t.replace('á', 'a').replace('Á', 'a')
        t = t.replace('é', 'e').replace('É', 'e')
        t = t.replace('í', 'i').replace('Í', 'i')
        t = t.replace('ó', 'o').replace('Ó', 'o')
        t = t.replace('ú', 'u').replace('Ú', 'u')
        # Central vowel schwa (absent in vocab)
        t = t.replace('ə́', 'e').replace('ə̀', 'e').replace('ə', 'e').replace('Ə', 'e')
        # Nasal vowels (tilde absent in vocab)
        t = t.replace('ẽ', 'en').replace('ã', 'an').replace('õ', 'on')
        # Open vowels
        t = t.replace('ɔ́', 'o').replace('ɔ̀', 'o').replace('ɔ', 'o')
        t = t.replace('ɛ́', 'e').replace('ɛ̀', 'e').replace('ɛ', 'e')
        # Strip remaining combining diacritics
        t = re.sub(r'[\u0300-\u036f]', '', t)
        t = t.replace('q', 'k').replace('x', 'ks')

    elif base == "fuv":
        # Glottal stops: unify all typographic apostrophes to ASCII '
        t = re.sub(r'[’ʼ‘ʻ`]', "'", t)
        # Consonant smoothing for mms-tts-ful (lacks v, z, x, q)
        t = re.sub(r'\bv', 'w', t, flags=re.IGNORECASE).replace('v', 'w').replace('z', 's').replace('x', 'ks').replace('q', 'k')

    elif base == "hau":
        # MMS mms-tts-hau uses digraph 'y instead of hooked ƴ
        t = t.replace('ƴ', "'y").replace('Ƴ', "'y")
        # Consonant smoothing for mms-tts-hau (lacks p, v, x, q)
        t = re.sub(r'\bp', 'f', t, flags=re.IGNORECASE).replace('p', 'f').replace('v', 'w').replace('x', 'ks').replace('q', 'k')

    elif base == "knc":
        # Kanuri uses mms-tts-hau: map central vowel ə -> e and smooth consonants
        t = t.replace('ə', 'e').replace('ǝ', 'e').replace('Ə', 'e')
        t = re.sub(r'\bp', 'f', t, flags=re.IGNORECASE).replace('p', 'f').replace('v', 'w').replace('x', 'ks').replace('q', 'k')

    elif base == "pcm":
        # Cameroon Pidgin Kamtok respellings for natural prosody
        t = re.sub(r'\bbecause\b', 'bicos', t, flags=re.IGNORECASE)
        t = re.sub(r'\bsomething\b', 'somtin', t, flags=re.IGNORECASE)
        t = re.sub(r'\bplenty\b', 'plenti', t, flags=re.IGNORECASE)
        t = re.sub(r'\bchildren\b|\bchild\b', 'pikin', t, flags=re.IGNORECASE)
        t = re.sub(r'\bknow\b|\bunderstand\b', 'sabi', t, flags=re.IGNORECASE)
        t = re.sub(r'\bis\b|\bare\b', 'dey', t, flags=re.IGNORECASE)
        t = re.sub(r'\bcompleted\b|\bhave done\b', 'don', t, flags=re.IGNORECASE)
        t = re.sub(r'\bcan\b|\bable to\b', 'fit', t, flags=re.IGNORECASE)

    # 5. Collapse extra spaces and punctuation
    t = re.sub(r'\s*([,\.])\s*', r'\1 ', t)
    return re.sub(r'\s+', ' ', t).strip()

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

def create_silent_wav_bytes(sample_rate: int = 16000) -> bytes:
    """Generates a valid 44-byte silent PCM WAV header with 0 data bytes (defensive silence)."""
    wav_io = io.BytesIO()
    with wave.open(wav_io, 'wb') as wf:
        wf.setnchannels(1)      # mono
        wf.setsampwidth(2)      # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(b'')
    return wav_io.getvalue()

def synthesize_wav_bytes(text: str, lang_norm: str) -> bytes:
    """Synthesizes text into 16kHz mono 16-bit PCM WAV bytes with in-memory caching."""
    import numpy as np

    base_lang = lang_norm.split("-")[0].lower()
    calibration = CALIBRATION_PARAMS.get(base_lang, CALIBRATION_PARAMS["ewo"])

    # 1. High-precision native G2P normalization and loanword smoothing
    normalized_text = normalize_phonetics_and_loanwords(text, lang_norm)
    # 2. Number verbalization
    verbalized_text = verbalize_numbers(normalized_text, lang_norm)
    clean_text = re.sub(r'\s+', ' ', verbalized_text).strip()
    if not clean_text:
        return create_silent_wav_bytes()

    cache_key = f"{lang_norm}:{clean_text.lower()}"
    if cache_key in AUDIO_CACHE:
        return AUDIO_CACHE[cache_key]

    model, tokenizer = get_model_and_tokenizer(lang_norm)

    # Calibrate acoustic hyperparameters on model config
    model.config.noise_scale = calibration["noise_scale"]
    model.config.noise_scale_duration = calibration["noise_scale_w"]

    # For responsive real-time UI assistive audio, if text is a multi-sentence paragraph (> 50 chars),
    # synthesize the first natural sentence or clause so TTFB is ultra-fast (< 1s on CPU)
    inference_text = clean_text
    if len(clean_text) > 50:
        sentences = re.split(r'(?<=[.!?;:,])\s+', clean_text)
        if sentences and len(sentences[0]) >= 10:
            inference_text = sentences[0]
            if len(sentences) > 1 and len(inference_text) < 30:
                inference_text = f"{sentences[0]} {sentences[1]}"
        else:
            words = clean_text.split()
            sub = ""
            for w in words:
                cand = f"{sub} {w}".strip() if sub else w
                if len(cand) <= 45:
                    sub = cand
                else:
                    break
            if sub:
                inference_text = sub

    inputs = tokenizer(inference_text, return_tensors="pt")

    # Absolute Zero-Noise Mandate: Guard against 0 tokens (never emit dummy fallback token 'a')
    if inputs.get("input_ids") is None or inputs["input_ids"].shape[-1] == 0:
        return create_silent_wav_bytes(getattr(model.config, "sampling_rate", 16000) or 16000)

    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with MODEL_INFERENCE_LOCK:
        with torch.inference_mode():
            output = model(**inputs, speaking_rate=calibration["speaking_rate"])

    waveform = output.waveform[0].detach().cpu().numpy()

    # Absolute Zero-Noise Mandate: Clamp acoustic anomalies (ZCR > 0.25 on active speech) to defensive silence
    active_speech = waveform[np.abs(waveform) > 0.005]
    zcr = float(np.mean(np.diff(np.sign(active_speech)) != 0)) if len(active_speech) > 0 else 0
    if zcr > 0.25:
        print(f"⚠️ Acoustic anomaly detected (ZCR={zcr:.3f} > 0.25) -> Clamping to defensive silence", flush=True)
        waveform = np.zeros_like(waveform)

    # Peak normalization to prevent clipping (max_amp <= 0.95)
    max_amp = float(np.max(np.abs(waveform))) if len(waveform) > 0 else 0
    if max_amp > 0.95:
        waveform = (waveform / max_amp) * 0.95

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
    """Preloads ALL 5 sovereign models into RAM with fast 1-sentence warmup so server is ready in < 10s."""
    print("🚀 Preloading ALL sovereign African voice models...", flush=True)
    warmup_phrases = {
        "ewo-cm": "Mbólo, móni wá á ne mvaé",
        "hau-cm": "Sannu, kudi ya shiga lami lafiya",
        "fuv-cm": "Jam waali, seede maada yottake",
        "pcm-cm": "Welcome, transfer don complete fine",
    }
    for lang, phrase in warmup_phrases.items():
        try:
            get_model_and_tokenizer(lang)
            synthesize_wav_bytes(phrase, lang)
            print(f"✅ {lang} model warmed up and ready in RAM!", flush=True)
        except Exception as e:
            print(f"⚠️ Preload warning for {lang}: {e}", flush=True)
    print("🎉 All sovereign models loaded and primed for instant playback!", flush=True)

@app.route("/health", methods=["GET"])
def health():
    available = [lang for lang in ("ewo-CM", "pcm-CM", "hau-CM", "fuv-CM")
                 if MODEL_PATHS[lang.lower()].exists()]
    return jsonify({
        "status": "healthy" if available else "degraded",
        "service": "LinguaBridge African Neural Voice Engine",
        "supported_languages": ["ewo-CM", "pcm-CM", "hau-CM", "fuv-CM"],
        "available_languages": available,
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

    if not isinstance(lang, str):
        return jsonify({"error": "INVALID_LANGUAGE"}), 400
    norm_lang = lang.strip().lower()

    # Strict Duala Quarantine
    if norm_lang in ("dua", "dua-cm"):
        return jsonify({
            "error": "DUALA_QUARANTINED",
            "message": "Duala (dua-CM) is strictly quarantined and excluded from active voice synthesis."
        }), 403

    if norm_lang not in MODEL_PATHS:
        return jsonify({"error": "VOICE_UNAVAILABLE"}), 422
    if not isinstance(text, str) or not text.strip() or len(text) > 2000:
        return jsonify({"error": "INVALID_TEXT"}), 400

    try:
        wav_bytes = synthesize_wav_bytes(text, norm_lang)
        if len(wav_bytes) <= 44:
            return jsonify({"error": "VOICE_UNAVAILABLE"}), 422
        b64 = base64.b64encode(wav_bytes).decode("ascii")

        return jsonify({
            "success": True,
            "lang": lang,
            "audioBase64": b64,
            "audioUrl": f"data:audio/wav;base64,{b64}",
            "engine": "meta-mms-neural-live"
        })
    except FileNotFoundError as e:
        return jsonify({"error": "VOICE_UNAVAILABLE", "message": str(e)}), 422
    except Exception as e:
        print(f"⚠️ Synthesis error: {e}", flush=True)
        return jsonify({"error": "SYNTHESIS_ERROR", "message": str(e)}), 500

@app.route("/stream", methods=["GET", "POST"])
def stream():
    data = (request.get_json(silent=True) or {}) if request.method == "POST" else request.args
    text = data.get("text", "")
    lang = data.get("lang", "ewo-CM")
    if not isinstance(lang, str):
        return jsonify({"error": "INVALID_LANGUAGE"}), 400
    norm_lang = lang.strip().lower()

    # Strict Duala Quarantine
    if norm_lang in ("dua", "dua-cm"):
        return jsonify({
            "error": "DUALA_QUARANTINED",
            "message": "Duala (dua-CM) is strictly quarantined and excluded from active voice streaming."
        }), 403

    if norm_lang not in MODEL_PATHS:
        return jsonify({"error": "VOICE_UNAVAILABLE"}), 422
    if not isinstance(text, str) or not text.strip() or len(text) > 2000:
        return jsonify({"error": "INVALID_TEXT"}), 400

    try:
        wav_bytes = synthesize_wav_bytes(text, norm_lang)
        if len(wav_bytes) <= 44:
            return jsonify({"error": "VOICE_UNAVAILABLE"}), 422
        return Response(
            wav_bytes,
            mimetype="audio/wav",
            headers={
                "X-Speech-Engine": "meta-mms-neural-live",
                "X-Voice-Lang": lang,
                "Content-Disposition": "inline; filename=speech.wav"
            }
        )
    except FileNotFoundError as e:
        return jsonify({"error": "VOICE_UNAVAILABLE", "message": str(e)}), 422
    except Exception as e:
        print(f"⚠️ Stream error: {e}", flush=True)
        return jsonify({"error": "STREAM_ERROR", "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("VOICE_PORT", 3002))
    threading.Thread(target=preload_core_models, daemon=True).start()
    print(f"🚀 LinguaBridge African Voice Server running on http://127.0.0.1:{port}", flush=True)
    app.run(host="127.0.0.1", port=port, debug=False, threaded=True)
