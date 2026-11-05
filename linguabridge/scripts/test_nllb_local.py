#!/usr/bin/env python3
"""
LinguaBridge NLLB-200 Local Inference Tester
Loads the local facebook/nllb-200-distilled-600M model and translates
text into Cameroonian languages (Ewondo, Fulfulde, Pidgin) with latency telemetry.
"""
import sys
import io
import time
from pathlib import Path

# Fix Windows console UTF-8 encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

ROOT_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT_DIR / "models" / "nllb-200-distilled-600M"

def main():
    print("=" * 65, flush=True)
    print("🌍 LINGUABRIDGE NLLB-200 LOCAL INFERENCE ENGINE", flush=True)
    print(f"📁 Modèle source : {MODEL_PATH}", flush=True)
    print("=" * 65, flush=True)

    if not (MODEL_PATH / "pytorch_model.bin").exists() and not (MODEL_PATH / "model.safetensors").exists():
        print("❌ Erreur : Les poids du modèle ne sont pas encore prêts !", flush=True)
        sys.exit(1)

    print("\n⏳ Chargement du Tokenizer et du Modèle en mémoire RAM...", flush=True)
    t0 = time.time()
    
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    import torch

    tokenizer = AutoTokenizer.from_pretrained(str(MODEL_PATH), local_files_only=True)
    model = AutoModelForSeq2SeqLM.from_pretrained(str(MODEL_PATH), local_files_only=True)
    load_time = time.time() - t0
    print(f"✅ Modèle chargé en mémoire en {load_time:.2f} secondes !", flush=True)

    test_sentences = [
        ("Bonjour, comment allez-vous ?", "ewo_Latn", "Ewondo (Centre/Sud)"),
        ("Le solde de votre compte est de 25 000 FCFA.", "ewo_Latn", "Ewondo (Bancaire)"),
        ("Bienvenue sur la plateforme financière.", "fuv_Latn", "Fulfulde / Peul (Nord)"),
        ("Envoyer de l'argent par téléphone rapidement.", "pcm_Latn", "Cameroon Pidgin English"),
    ]

    print("\n🚀 DÉBUT DES TRADUCTIONS EN DIRECT :", flush=True)
    print("-" * 65, flush=True)

    for source_text, target_lang, lang_name in test_sentences:
        t_start = time.time()
        
        # NLLB requires specifying source and target lang
        tokenizer.src_lang = "fra_Latn"
        inputs = tokenizer(source_text, return_tensors="pt")
        
        forced_bos_token_id = tokenizer.convert_tokens_to_ids(target_lang)
        
        with torch.no_grad():
            generated_tokens = model.generate(
                **inputs,
                forced_bos_token_id=forced_bos_token_id,
                max_length=64
            )
        
        translated = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
        elapsed_ms = (time.time() - t_start) * 1000

        print(f"🇫🇷 Source (FR)      : {source_text}", flush=True)
        print(f"🎯 Cible ({lang_name}) : {translated}", flush=True)
        print(f"⚡ Latence          : {elapsed_ms:.1f} ms", flush=True)
        print("-" * 65, flush=True)

    print("\n🎉 TEST D'INFÉRENCE LOCAL TERMINÉ AVEC SUCCÈS !", flush=True)

if __name__ == "__main__":
    main()
