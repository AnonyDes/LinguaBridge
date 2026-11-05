#!/usr/bin/env python3
"""Download and curate CC-BY-4.0 English-Duala sentence pairs into a research dictionary.
NOT a certified banking translator. Attribution and original MT560 provenance required.
"""
import argparse
import json
import re
from pathlib import Path

DATASET = "michsethowusu/english-duala_sentence-pairs_mt560"
FINANCIAL = re.compile(r"\b(bank|banking|payment|money|transfer|deposit|withdraw|cash|transaction|loan|debit|invoice|savings|wallet|fraud|receipt|currency|credit card|bank account|account balance|mobile money)\b", re.I)

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
    from huggingface_hub import HfApi
    info = HfApi().dataset_info(DATASET)
    files = [x.rfilename for x in info.siblings if x.rfilename.endswith('.parquet')]
    if len(files) != 1:
        raise ValueError(f"Expected exactly one Parquet shard, got {files}")
    path = hf_hub_download(repo_id=DATASET, repo_type="dataset", filename=files[0], revision=info.sha)
    table = pq.read_table(path)
    if not {'eng', 'dua'}.issubset(table.column_names):
        raise ValueError(f"Unexpected columns: {table.column_names}")
    rows = curate(table.to_pylist())
    payload = {"source": "https://huggingface.co/datasets/" + DATASET, "source_revision": info.sha, "source_file": files[0], "source_row_count": table.num_rows, "source_columns": table.column_names, "original_corpus": "OPUS MT560 (attribution and upstream rights require verification)", "declared_license": "CC-BY-4.0 (dataset card declaration; upstream rights not verified)", "attribution_required": True, "status": "unverified_research_dictionary_not_production", "row_count": len(rows), "banking_candidate_count": sum(x["domain"] == "banking_candidate" for x in rows), "banking_ui_verified_count": 0, "entries": rows}
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"total": len(rows), "banking_candidates": payload["banking_candidate_count"], "path": str(target)}))

if __name__ == "__main__":
    main()
