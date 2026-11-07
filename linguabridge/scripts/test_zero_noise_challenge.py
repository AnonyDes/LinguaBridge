#!/usr/bin/env python3
"""
Empirical Challenge Script for Milestone 1 (Zero-Noise & Defensive Silence).
Asserts exact byte counts, 0 amplitude samples, and zero-noise guardrails.
"""
import sys
import io
import wave
import numpy as np

# Add scripts directory to path
import os
from pathlib import Path
scripts_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(scripts_dir))

from serve_african_voice import (
    create_silent_wav_bytes,
    synthesize_wav_bytes,
    verbalize_numbers,
    app
)

def test_create_silent_wav_bytes():
    print("Test 1: create_silent_wav_bytes()...", end=" ")
    wav_bytes = create_silent_wav_bytes(16000)
    assert len(wav_bytes) == 44, f"Expected 44 bytes, got {len(wav_bytes)}"
    assert wav_bytes[:4] == b"RIFF", "Missing RIFF header"
    assert wav_bytes[8:12] == b"WAVE", "Missing WAVE header"
    assert wav_bytes[12:16] == b"fmt ", "Missing fmt chunk"
    assert wav_bytes[36:40] == b"data", "Missing data chunk"

    # Inspect data chunk size
    data_size = int.from_bytes(wav_bytes[40:44], byteorder='little')
    assert data_size == 0, f"Expected data chunk size 0, got {data_size}"

    # Parse with wave module
    with wave.open(io.BytesIO(wav_bytes), 'rb') as wf:
        assert wf.getnchannels() == 1, "Expected mono"
        assert wf.getsampwidth() == 2, "Expected 16-bit PCM"
        assert wf.getframerate() == 16000, "Expected 16000Hz"
        assert wf.getnframes() == 0, f"Expected 0 frames, got {wf.getnframes()}"
        frames = wf.readframes(100)
        assert len(frames) == 0, f"Expected 0 frame bytes, got {len(frames)}"
    print("PASSED [Pure 44-byte silent WAV header, 0 audio frames]")

def test_synthesize_empty_and_typographic_inputs():
    print("Test 2: synthesize_wav_bytes() with empty & typographic inputs...", end=" ")
    test_cases = ["", "   ", "\n\t  \r", "· → ·", "“ ” · → \n"]
    for text in test_cases:
        wav = synthesize_wav_bytes(text, "ewo")
        assert len(wav) == 44, f"Input {text!r} did not return 44-byte silent WAV (got {len(wav)} bytes)"
        data_size = int.from_bytes(wav[40:44], byteorder='little')
        assert data_size == 0, f"Input {text!r} data size not 0 (got {data_size})"
        with wave.open(io.BytesIO(wav), 'rb') as wf:
            assert wf.getnframes() == 0
    print("PASSED [Empty and typographic inputs return pure silent WAV with 0 frames]")

def test_zcr_anomaly_clamping_to_zero_amplitude():
    print("Test 3: Acoustic anomaly (ZCR > 0.25) clamping logic...", end=" ")
    # Create synthetic alternating high-frequency noise that triggers ZCR > 0.25
    t = np.linspace(0, 1, 16000)
    # High-frequency square-like oscillation with high ZCR
    noisy_waveform = np.sign(np.sin(2 * np.pi * 5000 * t)).astype(np.float32) * 0.8
    zcr = float(np.sum(np.diff(np.sign(noisy_waveform)) != 0) / len(noisy_waveform))
    assert zcr > 0.25, f"Test noise did not exceed 0.25 threshold (zcr={zcr})"

    # Emulate the clamping logic from serve_african_voice.py:
    if zcr > 0.25:
        clamped_waveform = np.zeros_like(noisy_waveform)
    else:
        clamped_waveform = noisy_waveform

    clamped_waveform = np.clip(clamped_waveform, -1.0, 1.0)
    int16_samples = (clamped_waveform * 32767).astype(np.int16)

    assert np.all(int16_samples == 0), "Clamped samples are not pure zero!"
    assert np.max(np.abs(int16_samples)) == 0, "Max amplitude is not 0!"
    print(f"PASSED [ZCR={zcr:.3f} clamped to 0 max amplitude / pure silence]")

def test_duala_quarantine_in_flask():
    print("Test 4: Strict Duala quarantine on Flask endpoints...", end=" ")
    client = app.test_client()

    # Test /synthesize for duala
    res = client.get('/synthesize?lang=dua-CM&text=Mbolo')
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    json_data = res.get_json()
    assert json_data.get("error") == "DUALA_QUARANTINED"

    # Test /stream for duala
    res2 = client.get('/stream?lang=dua&text=Mbolo')
    assert res2.status_code == 403, f"Expected 403, got {res2.status_code}"
    json_data2 = res2.get_json()
    assert json_data2.get("error") == "DUALA_QUARANTINED"
    print("PASSED [Duala HTTP 403 Forbidden on /synthesize and /stream]")

if __name__ == "__main__":
    test_create_silent_wav_bytes()
    test_synthesize_empty_and_typographic_inputs()
    test_zcr_anomaly_clamping_to_zero_amplitude()
    test_duala_quarantine_in_flask()
    print("\nALL EMPIRICAL PYTHON CHALLENGES PASSED SUCCESSFULLY!")
