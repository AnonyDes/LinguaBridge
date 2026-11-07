import io
import sys
from pathlib import Path
import numpy as np

# Force UTF-8 stdout
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from transformers import VitsTokenizer, VitsModel
import torch

MODELS_BASE = Path("linguabridge/models/african-tts")

test_phrases = [
    ("fuv-cm", "mms-tts-ful", "NAYOKAN · FOUNDING PRINCIPLE"),
    ("fuv-cm", "mms-tts-ful", "Find Training\n→\nGet New Business Support\nPartner with us"),
    ("fuv-cm", "mms-tts-ful", "“Practical Gandal can lead to Kuugal e Keso Njulaaku."),
    ("fuv-cm", "mms-tts-ful", "GO'O"),
    ("hau-cm", "mms-tts-hau", "Taimaka Mutane Mayar Dabaru Zuwa Ayyukan yi da Kasuwanci A Kamaru."),
    ("hau-cm", "mms-tts-hau", "Nayokan Na bayarwa handson Horo da yana taimakawa Mutane Haɓaka Kasuwanci Dabaru."),
    ("hau-cm", "mms-tts-hau", "Nemi Horo\n→\nSami Fara kasuwanci Tallafa\nPartner with us"),
    ("knc-cm", "mms-tts-hau", "How the pieces fit together."),
    ("knc-cm", "mms-tts-hau", "Learn practical Nəmngəla"),
]

for lang, model_dir_name, raw_text in test_phrases:
    model_dir = MODELS_BASE / model_dir_name
    tokenizer = VitsTokenizer.from_pretrained(str(model_dir))
    model = VitsModel.from_pretrained(str(model_dir))
    model.eval()

    inputs = tokenizer(raw_text, return_tensors="pt")
    input_ids = inputs["input_ids"][0].tolist()
    tokens = tokenizer.convert_ids_to_tokens(input_ids)
    unk_count = tokens.count('<unk>')

    with torch.no_grad():
        output = model(**inputs)
    waveform = output.waveform[0].numpy()
    
    # Analyze waveform
    max_amp = float(np.max(np.abs(waveform)))
    mean_amp = float(np.mean(np.abs(waveform)))
    zero_crossings = int(np.sum(np.diff(np.sign(waveform)) != 0))
    zero_crossing_rate = zero_crossings / len(waveform) if len(waveform) > 0 else 0

    print(f"\n--- [{lang}] '{raw_text[:40]}' ---")
    print(f"Tokens: {len(tokens)}, <unk> count: {unk_count}")
    if unk_count > 0:
        unk_positions = [i for i, t in enumerate(tokens) if t == '<unk>']
        print(f"Unknown token positions: {unk_positions[:10]}")
    print(f"Max amp: {max_amp:.3f}, Mean amp: {mean_amp:.4f}, ZCR (Zero Crossing Rate): {zero_crossing_rate:.3f}")
    if zero_crossing_rate > 0.35:
        print("⚠️ HIGH ZERO CROSSING RATE -> NOISE / STATIC DETECTED!")
