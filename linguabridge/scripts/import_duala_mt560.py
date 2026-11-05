#!/usr/bin/env python3
"""Download and curate CC-BY-4.0 English-Duala sentence pairs into a research dictionary.
NOT a certified banking translator. Attribution and original MT560 provenance required.
"""
import argparse
import json
import re
from pathlib import Path

DATASET = "michsethowusu/english-duala_sentence-pairs_mt560"
FINANCIAL = re.compile(r"\\b(account|bank|balance|payment|pay|money|transfer|send|receive|deposit|withdraw|cash|card|pin|password|transaction|fee|loan|credit|debit|bill|invoice|security|verify|confirm|recipient|currency|interest|savings|wallet|mobile money|fraud|statement|receipt|amount|login|sign in)\\b", re.I)

def curate(rows):
    seen = set()
    out = []
    for row in rows:
        en = str(row.get("eng") or "").strip()
        dua = str(row.get("dua") or "").strip()
        if not en or not dua or en.lower() == dua.lower():
            continue
        key = (en.casefold(), dua.casefold())
        if key in seen:
            continue
        seen.add(key)
        out.append({"en": en, "dua": dua, "domain": "banking_candidate" if FINANCIAL.search(en) else "general", "reviewed": False})
    return sorted(out, key=lambda x: (x["domain"] != "banking_candidate", x["en"].casefold()))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default="linguabridge/docs/research/duala-english-parallel-dictionary.json")
    args = ap.parse_args()
    from huggingface_hub import hf_hub_download
    import pyarrow.parquet as pq
    path = hf_hub_download(repo_id=DATASET, repo_type="dataset", filename="data/train-00000-of-00001.parquet")
    table = pq.read_table(path, columns=["eng", "dua"])
    rows = curate(table.to_pylist())
    payload = {"source": "https://huggingface.co/datasets/" + DATASET, "original_corpus": "OPUS MT560", "declared_license": "CC-BY-4.0", "attribution_required": True, "status": "unverified_research_dictionary_not_production", "row_count": len(rows), "banking_candidate_count": sum(x["domain"] == "banking_candidate" for x in rows), "entries": rows}
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"total": len(rows), "banking_candidates": payload["banking_candidate_count"], "path": str(target)}))

if __name__ == "__main__":
    main()
