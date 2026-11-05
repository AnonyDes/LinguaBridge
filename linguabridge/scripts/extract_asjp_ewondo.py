#!/usr/bin/env python3
"""Extract Ewondo ASJP research candidates (CC BY 4.0), never auto-merge.
Run from linguabridge/: python3 scripts/extract_asjp_ewondo.py
Downloads CLDF language/form/parameter CSVs from lexibank/asjp.
ASJP uses phonetic transcription, not verified Ewondo orthography.
"""
import csv
import io
import json
import pathlib
import urllib.request

BASE = "https://raw.githubusercontent.com/lexibank/asjp/master/cldf/"
OUT = pathlib.Path("docs/research/ewondo-asjp-candidates.json")
def rows(name):
    with urllib.request.urlopen(BASE + name, timeout=90) as response:
        return list(csv.DictReader(io.TextIOWrapper(response, encoding="utf-8-sig")))

def main():
    languages = rows("languages.csv")
    matches = [r for r in languages if (
        "ewondo" in " ".join(str(v) for v in r.values()).casefold()
        or str(r.get("Glottocode", "")).casefold() == "ewon1239"
        or str(r.get("ISO639P3code", "")).casefold() == "ewo"
    )]
    ids = {r["ID"] for r in matches}
    if not ids:
        raise SystemExit("No Ewondo variety found: inspect CLDF schema before proceeding.")
    concepts = {r["ID"]: r for r in rows("parameters.csv")}
    forms = rows("forms.csv")
    selected = []
    for r in forms:
        if r.get("Language_ID") not in ids:
            continue
        selected.append({
            "language_id": r["Language_ID"],
            "concept_id": r.get("Parameter_ID"),
            "concept": concepts.get(r.get("Parameter_ID"), {}).get("Name", ""),
            "transcription": r.get("Form", ""),
            "source_id": r.get("Source", ""),
            "status": "phonetic_candidate_needs_orthography_review",
        })
    dedup = list({(r["language_id"],r["concept_id"],r["transcription"]):r for r in selected}.values())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "source": "https://github.com/lexibank/asjp",
        "license": "CC-BY-4.0",
        "citation": "Wichmann et al. (eds.), ASJP Database v21 (2025)",
        "note": "Research candidates only. Do not treat ASJP phonetic transcription as validated Ewondo spelling, or concept labels as French translations.",
        "varieties": matches, "raw_form_count": len(selected), "unique_form_count": len(dedup),
        "entries": dedup,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"ASJP: {len(matches)} Ewondo varieties; {len(dedup)} distinct forms -> {OUT}")

if __name__ == "__main__":
    main()
