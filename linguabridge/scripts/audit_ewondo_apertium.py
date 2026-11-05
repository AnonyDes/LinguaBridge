#!/usr/bin/env python3
"""Audit public Apertium Ewondo–French lexical pairs without overwriting LinguaBridge.
Run: python3 scripts/audit_ewondo_apertium.py
License: upstream Apertium data GPL-3.0. Review redistribution obligations before importing.
"""
import collections
import json
import urllib.request
import xml.etree.ElementTree as ET

URL = "https://raw.githubusercontent.com/Ngue-Um/apertium-ewo-fra/main/apertium-ewo-fra.ewo-fra.dix"

def text_of(node):
    if node is None:
        return ""
    return "".join(node.itertext()).strip()

def main():
    with urllib.request.urlopen(URL, timeout=30) as response:
        root = ET.fromstring(response.read())
    pairs = []
    for entry in root.findall(".//section/e"):
        for pair in entry.findall("./p"):
            left = text_of(pair.find("l"))
            right = text_of(pair.find("r"))
            if left and right:
                pairs.append((left, right))
    unique = sorted(set(pairs))
    duplicates = len(pairs) - len(unique)
    report = {
        "source": URL,
        "license": "GPL-3.0",
        "raw_bilingual_pairs": len(pairs),
        "unique_bilingual_pairs": len(unique),
        "duplicate_pairs": duplicates,
        "unique_ewondo_forms": len({x for x, _ in unique}),
        "unique_french_forms": len({y for _, y in unique}),
        "note": "Counts are source-only. Do not add to existing LinguaBridge totals without comparison. XML left/right orientation must be validated.",
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    with open("ewondo-apertium-audit.json", "w", encoding="utf-8") as f:
        json.dump({"report": report, "pairs": [{"left": x, "right": y} for x,y in unique]}, f, ensure_ascii=False, indent=2)
    print("Saved ewondo-apertium-audit.json (audit only; no automatic import).")

if __name__ == "__main__":
    main()
