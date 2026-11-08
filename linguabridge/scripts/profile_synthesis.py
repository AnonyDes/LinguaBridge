import sys
import time
from pathlib import Path

# Add script dir
sys.path.insert(0, str(Path("linguabridge/scripts").resolve()))
import serve_african_voice as srv

print("Preloading models...")
srv.preload_core_models()

test_text = "Mbólo, móni wá á ne mvaé"
print("\n--- TEST 1: Identical to preloaded phrase ---")
t0 = time.time()
srv.synthesize_wav_bytes(test_text, "ewo-cm")
print(f"Elapsed: {(time.time() - t0)*1000:.1f}ms")

new_text = "Bienvenue sur la plateforme Nayokan."
print(f"\n--- TEST 2: New text ({len(new_text)} chars) ---")
t0 = time.time()
srv.synthesize_wav_bytes(new_text, "ewo-cm")
print(f"Elapsed: {(time.time() - t0)*1000:.1f}ms")

print(f"\n--- TEST 3: Re-read of Test 2 (Cache hit) ---")
t0 = time.time()
srv.synthesize_wav_bytes(new_text, "ewo-cm")
print(f"Elapsed: {(time.time() - t0)*1000:.1f}ms")
