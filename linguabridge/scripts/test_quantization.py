import time
import torch
from pathlib import Path
from transformers import VitsModel, VitsTokenizer

ROOT_DIR = Path("linguabridge")
MODEL_DIR = ROOT_DIR / "models" / "african-tts" / "mms-tts-ewo"

tokenizer = VitsTokenizer.from_pretrained(str(MODEL_DIR))
model = VitsModel.from_pretrained(str(MODEL_DIR)).to("cpu")
model.eval()

inputs = tokenizer("Mbólo, móni wá á ne mvaé", return_tensors="pt")

# Baseline
t0 = time.time()
with torch.inference_mode():
    out1 = model(**inputs)
baseline_time = (time.time() - t0) * 1000
print(f"FP32 Baseline Time: {baseline_time:.1f}ms")

# Test dynamic quantization
try:
    quantized_model = torch.quantization.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )
    t0 = time.time()
    with torch.inference_mode():
        out2 = quantized_model(**inputs)
    quant_time = (time.time() - t0) * 1000
    print(f"Quantized INT8 Time: {quant_time:.1f}ms (Speedup: {baseline_time / quant_time:.2f}x)")
except Exception as e:
    print(f"Quantization test failed or unsupported: {e}")
