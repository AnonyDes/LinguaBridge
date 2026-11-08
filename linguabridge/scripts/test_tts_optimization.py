import time
import os
import torch
from pathlib import Path
from transformers import VitsModel, VitsTokenizer

ROOT_DIR = Path("linguabridge")
MODEL_DIR = ROOT_DIR / "models" / "african-tts" / "mms-tts-ewo"

tokenizer = VitsTokenizer.from_pretrained(str(MODEL_DIR))
model = VitsModel.from_pretrained(str(MODEL_DIR)).to("cpu")
model.eval()

text_samples = {
    "short (20 chars)": "Mbólo, móni wá á ne.",
    "clause (45 chars)": "Mbólo, móni wá á ne mvaé e beba.",
    "sentence (75 chars)": "Bienvenue sur la plateforme Nayokan pour apprendre les langues africaines.",
    "paragraph (120 chars)": "Bienvenue sur la plateforme Nayokan pour apprendre les langues africaines et les nouvelles technologies bancaires aujourd'hui."
}

print("=== THREAD COUNT EXPERIMENT ===")
for num_threads in [2, 4, 6, 8]:
    torch.set_num_threads(num_threads)
    inputs = tokenizer("Mbólo, móni wá", return_tensors="pt")
    # warmup
    with torch.inference_mode():
        _ = model(**inputs)
    t0 = time.time()
    for _ in range(3):
        with torch.inference_mode():
            _ = model(**inputs)
    avg_t = ((time.time() - t0) / 3) * 1000
    print(f"Threads: {num_threads:2} -> Short text inference: {avg_t:.1f}ms")

print("\n=== TEXT LENGTH vs LATENCY (with optimal threads) ===")
torch.set_num_threads(min(8, os.cpu_count() or 4))
for label, txt in text_samples.items():
    inputs = tokenizer(txt, return_tensors="pt")
    t0 = time.time()
    with torch.inference_mode():
        out = model(**inputs)
    lat = (time.time() - t0) * 1000
    duration_s = out.waveform.shape[-1] / model.config.sampling_rate
    rtf = (lat / 1000) / duration_s
    print(f"{label:22} | Chars: {len(txt):3} | Latency: {lat:6.1f}ms | Audio Dur: {duration_s:4.2f}s | Real-Time Factor: {rtf:4.2f}x")
