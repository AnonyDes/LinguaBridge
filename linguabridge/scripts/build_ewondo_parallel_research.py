#!/usr/bin/env python3
"""Research-only Ewondo/French alignment via AfriSpeech Africa Corpus Builder.

Requires: pip install huggingface_hub
Usage:
  git clone https://github.com/AfriSpeech/africa-corpus-builder.git /tmp/africa-corpus-builder
  python scripts/build_ewondo_parallel_research.py --builder /tmp/africa-corpus-builder/africa_corpus.py

IMPORTANT: The upstream MIT license applies to CODE, not Bible verse text.
Do not commit, redistribute, ship, or train on generated verse pairs without
checking the rights of BOTH specific Bible editions and intended uses.
"""
import argparse
import csv
import importlib.util
import json
import pathlib
import sys

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--builder", type=pathlib.Path, required=True)
    parser.add_argument("--out", type=pathlib.Path, default=pathlib.Path("local-research/ewondo-french-parallel.csv"))
    parser.add_argument("--limit", type=int, default=7951)
    args = parser.parse_args()
    if not args.builder.is_file():
        parser.error("Builder module not found; clone AfriSpeech/africa-corpus-builder first")
    spec = importlib.util.spec_from_file_location("africa_corpus", args.builder)
    module = importlib.util.module_from_spec(spec)
    sys.modules["africa_corpus"] = module
    spec.loader.exec_module(module)
    rows = module.parallel("ewo", "fr", limit=args.limit)
    unique = {}
    for verse_key, ewondo, french in rows:
        ewondo, french = str(ewondo).strip(), str(french).strip()
        if ewondo and french:
            unique[(verse_key, ewondo, french)] = (verse_key, ewondo, french)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["verse_key", "ewondo", "french"])
        writer.writerows(unique.values())
    report = {
        "source": "AfriSpeech/africa-corpus via Africa Corpus Builder",
        "source_language": "ewo", "target_language": "fr",
        "parallel_rows": len(rows), "nonempty_unique_pairs": len(unique),
        "output": str(args.out),
        "rights": "Bible texts: third-party licenses must be verified per version; research-only local artifact",
        "production_import_allowed": False,
        "banking_domain": False
    }
    args.out.with_suffix(".report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
