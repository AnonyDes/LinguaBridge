#!/usr/bin/env python3
"""Deep audit of the entire speech chain: neural server → extension → user ears."""
import sys, io, os, time, json, base64, wave, struct
import urllib.request

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

try:
    import numpy as np
except ImportError:
    np = None

AUDIT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(AUDIT_DIR)

print("=" * 60)
print("DEEP SPEECH CHAIN AUDIT")
print("=" * 60)

# 1. Check neural server health
print("\n[1] Neural server health check...")
try:
    res = urllib.request.urlopen('http://127.0.0.1:3002/health', timeout=3)
    health = json.loads(res.read())
    print(f"   Status: {health['status']}")
    print(f"   Loaded models: {health.get('loaded_models', [])}")
except Exception as e:
    print(f"   ERROR: Neural server not reachable: {e}")
    sys.exit(1)

# 2. Test synthesis for all 5 languages
print("\n[2] Neural synthesis test for all 5 sovereign languages...")
test_phrases = [
    ('ewo-cm', 'Mbolo ma boti'),
    ('hau-cm', 'Sannu da zuwa'),
    ('fuv-cm', 'Jam bandu ceede'),
    ('knc-cm', 'Ndawuro kudi'),
    ('pcm-cm', 'How far my people'),
]

for lang, text in test_phrases:
    t0 = time.time()
    try:
        url = f'http://127.0.0.1:3002/synthesize?lang={lang}&text={urllib.request.quote(text)}'
        res = urllib.request.urlopen(url, timeout=10)
        data = json.loads(res.read())
        t1 = time.time()
        
        wav_bytes = base64.b64decode(data['audioBase64'])
        with wave.open(io.BytesIO(wav_bytes), 'rb') as wf:
            channels = wf.getnchannels()
            sw = wf.getsampwidth()
            sr = wf.getframerate()
            nframes = wf.getnframes()
            dur = nframes / sr
            raw = wf.readframes(nframes)
        
        if np:
            samples = np.frombuffer(raw, dtype=np.int16)
            rms = np.sqrt(np.mean(samples.astype(float)**2))
            peak = max(abs(int(samples.min())), abs(int(samples.max())))
            peak_pct = peak / 32767 * 100
        else:
            rms = 0
            peak = 0
            peak_pct = 0
        
        latency_ms = int((t1 - t0) * 1000)
        print(f"   [{lang}] '{text}'")
        print(f"      WAV: {channels}ch, {sw*8}-bit, {sr}Hz, {nframes} frames, {dur:.2f}s")
        print(f"      Audio: RMS={rms:.0f}, Peak={peak} ({peak_pct:.1f}%), Size={len(wav_bytes)}B")
        print(f"      Latency: {latency_ms}ms, Engine: {data.get('engine', '?')}")
        
        # Save WAV for manual listening
        outfile = os.path.join(AUDIT_DIR, f"audit_{lang.replace('-','_')}.wav")
        with open(outfile, 'wb') as f:
            f.write(wav_bytes)
        print(f"      Saved: {outfile}")
        
    except Exception as e:
        print(f"   [{lang}] ERROR: {e}")

# 3. Check if formant synthesizer output is what the user hears  
print("\n[3] Testing the client-side formant synthesizer (the FALLBACK)...")
print("   This is the 'generateAcousticWav' code in african-voice-provider.ts")
print("   It runs when:")
print("     a) The 600ms timer fires before the neural server responds")
print("     b) chrome.runtime.sendMessage fails or returns no audioUrl")
print("     c) The background.ts AfricanVoiceProvider.synthesize() itself")
print("        can't reach 127.0.0.1:3002 and falls back to generateAcousticWav")
print()
print("   KEY INSIGHT: In the Chrome extension, background.ts runs")
print("   AfricanVoiceProvider from speech-engine package. That provider")
print("   tries fetch('http://127.0.0.1:3002/...') INSIDE the extension")
print("   background context. If that fetch succeeds, it sends back the")
print("   neural audio. If it fails (CORS, timeout, network), it falls")
print("   back to generateAcousticWav() which is the FORMANT SYNTHESIZER.")
print()
print("   THE FORMANT SYNTHESIZER IS NOT REAL SPEECH. It generates")
print("   buzzy/robotic formant-filtered glottal pulse trains.")
print("   It sounds like 'a radio on the wrong frequency'.")

# 4. Check what happens in the REAL extension context
print("\n[4] Critical path analysis: what the extension ACTUALLY does...")
print()
print("   content.ts speak() is called on user click/touch:")
print("   ┌─ speak(text, phonetic, onEnd, targetLang)")
print("   │")
print("   ├─ 1. Check audioBufferCache (Map<string, AudioBuffer>)")
print("   │     └─ Cache HIT → playBuffer() → 0ms. DONE")
print("   │")
print("   ├─ 2. Set 600ms fallback timer")
print("   │     └─ Timer fires → playAcousticAfricanVoice()")  
print("   │                       └─ AfricanVoiceProvider.generateAcousticWav()")
print("   │                           └─ FORMANT BUZZING (the radio noise)")
print("   │")
print("   ├─ 3. chrome.runtime.sendMessage({type: 'SYNTHESIZE_SPEECH'})")
print("   │     └─ background.ts receives it:")
print("   │        └─ africanVoiceProvider.synthesize(text, lang)")
print("   │           ├─ Try fetch('http://127.0.0.1:3002/synthesize')")
print("   │           │  └─ SUCCESS → neural WAV base64 → sendResponse()")
print("   │           └─ FAIL → generateAcousticWav() → sendResponse()")
print("   │                     └─ FORMANT BUZZING")
print("   │")
print("   └─ 4. content.ts callback receives response:")
print("         ├─ If handled=true (timer fired): cache neural audio for next time")
print("         └─ If handled=false: playAfricanAudio(audioUrl)")
print()

# 5. THE ROOT CAUSE DIAGNOSIS
print("=" * 60)
print("ROOT CAUSE DIAGNOSIS")
print("=" * 60)
print()
print("SCENARIO A: The 600ms timer fires BEFORE the neural server responds")
print("  → The formant synthesizer (generateAcousticWav) plays buzzy noise")
print("  → Even when neural audio arrives later, user already heard noise")
print()
print("SCENARIO B: background.ts fetch to 127.0.0.1:3002 fails")
print("  → Chrome extension background scripts may block localhost fetch")
print("  → AfricanVoiceProvider falls back to generateAcousticWav()")
print("  → Returns formant buzzing to content.ts")
print("  → content.ts plays that noise via playAfricanAudio()")
print()
print("SCENARIO C: content.ts fallback path directly calls")
print("  playAcousticAfricanVoice() which calls generateAcousticWav()")
print("  at the AudioContext.sampleRate (usually 44100 or 48000 Hz)")
print("  but the WAV header says 16000 Hz → SAMPLE RATE MISMATCH")
print("  → decodeAudioData may succeed but audio plays at wrong speed")
print()
print("MOST LIKELY ROOT CAUSE: The generateAcousticWav formant synthesizer")
print("is what the user hears. It is NOT capable of producing intelligible")
print("speech - it's a basic glottal pulse + biquad filter bank that")
print("produces vowel-like buzzing sounds. No matter how we tune it,")
print("it will NEVER sound like human speech.")
print()
print("THE FIX: Remove the formant synthesizer as a fallback entirely.")
print("The ONLY sources of speech should be:")
print("  1. The Meta MMS neural server (127.0.0.1:3002) - real speech")
print("  2. window.speechSynthesis with any available voice - real speech")
print("     (even fr-FR is better than formant buzzing)")
print()

# 6. Verify neural server latency under load
print("\n[6] Neural server latency benchmark (10 requests)...")
latencies = []
for i in range(10):
    t0 = time.time()
    try:
        url = f'http://127.0.0.1:3002/synthesize?lang=ewo-cm&text={urllib.request.quote("Mbolo ma boti")}'
        res = urllib.request.urlopen(url, timeout=5)
        res.read()
        t1 = time.time()
        latencies.append(int((t1-t0)*1000))
    except:
        latencies.append(-1)

print(f"   Latencies (ms): {latencies}")
if latencies:
    valid = [l for l in latencies if l > 0]
    if valid:
        print(f"   Average: {sum(valid)//len(valid)}ms")
        print(f"   Min: {min(valid)}ms, Max: {max(valid)}ms")
        print(f"   Requests under 600ms: {sum(1 for l in valid if l < 600)}/{len(valid)}")

print("\n" + "=" * 60)
print("AUDIT COMPLETE")
print("=" * 60)
