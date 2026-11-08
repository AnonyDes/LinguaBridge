import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path("linguabridge/scripts").resolve()))
import serve_african_voice as srv
import torch

model, tokenizer = srv.get_model_and_tokenizer("ewo-cm")
text = "Bienvenue sur la plateforme Nayokan."

# Profile sub-steps
t0 = time.time()
clean_text = srv.verbalize_numbers(srv.normalize_phonetics_and_loanwords(text, "ewo-cm"), "ewo-cm")
t_prep = (time.time() - t0) * 1000

t0 = time.time()
inputs = tokenizer(clean_text, return_tensors="pt")
inputs = {k: v.to(srv.DEVICE) for k, v in inputs.items()}
t_tok = (time.time() - t0) * 1000

t0 = time.time()
with torch.inference_mode():
    output = model(**inputs, speaking_rate=0.909)
t_infer = (time.time() - t0) * 1000

t0 = time.time()
waveform = output.waveform[0].detach().cpu().numpy()
t_numpy = (time.time() - t0) * 1000

print(f"Preparation: {t_prep:.2f}ms")
print(f"Tokenizer:   {t_tok:.2f}ms")
print(f"Inference:   {t_infer:.2f}ms")
print(f"Numpy/Wave:  {t_numpy:.2f}ms")
