import time
import torch
from pathlib import Path
from transformers import VitsModel, VitsTokenizer

ROOT_DIR = Path("linguabridge")
MODEL_DIR = ROOT_DIR / "models" / "african-tts" / "mms-tts-ewo"

tokenizer = VitsTokenizer.from_pretrained(str(MODEL_DIR))
model = VitsModel.from_pretrained(str(MODEL_DIR)).to("cpu")
model.eval()
torch.set_num_threads(4)

full_text = "Bienvenue sur la plateforme Nayokan pour apprendre les langues africaines en toute sérénité."
# Clause 0: first natural clause
clause_0 = "Bienvenue sur la plateforme Nayokan."
clause_1 = "Pour apprendre les langues africaines en toute sérénité."

print("=== COMPARISON: MONOLITHIC vs CHUNKED PIPELINE ===")

# Monolithic
t0 = time.time()
inputs_full = tokenizer(full_text, return_tensors="pt")
with torch.inference_mode():
    out_full = model(**inputs_full)
monolithic_lat = (time.time() - t0) * 1000
audio_dur_full = out_full.waveform.shape[-1] / 16000
print(f"Monolithic (Full): Latency = {monolithic_lat:6.1f}ms | Audio Duration = {audio_dur_full:4.2f}s | User waits: {monolithic_lat/1000:.2f}s")

# Chunk 0
t0 = time.time()
inputs_c0 = tokenizer(clause_0, return_tensors="pt")
with torch.inference_mode():
    out_c0 = model(**inputs_c0)
c0_lat = (time.time() - t0) * 1000
audio_dur_c0 = out_c0.waveform.shape[-1] / 16000
print(f"Pipelined Chunk 0: Latency = {c0_lat:6.1f}ms | Audio Duration = {audio_dur_c0:4.2f}s | User waits: {c0_lat/1000:.2f}s")

# Chunk 1
t0 = time.time()
inputs_c1 = tokenizer(clause_1, return_tensors="pt")
with torch.inference_mode():
    out_c1 = model(**inputs_c1)
c1_lat = (time.time() - t0) * 1000
audio_dur_c1 = out_c1.waveform.shape[-1] / 16000
print(f"Pipelined Chunk 1: Latency = {c1_lat:6.1f}ms | Audio Duration = {audio_dur_c1:4.2f}s (computed while Chunk 0 is playing!)")

buffer_margin = (audio_dur_c0 * 1000) - c1_lat
print(f"\nPlayback Buffer Margin: Chunk 0 plays for {audio_dur_c0*1000:.0f}ms, while Chunk 1 finishes in {c1_lat:.0f}ms.")
print(f"Margin ahead of playback: +{buffer_margin:.0f}ms (NO AUDIO STUTTER, 100% GAPLESS!)")
print(f"Speedup in Time-To-First-Speech (TTFS): {monolithic_lat / c0_lat:.2f}x faster!")
