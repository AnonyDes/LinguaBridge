#!/usr/bin/env python3
"""Build compact exact English-Duala research lookup; never derive word translations."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = root / 'docs/research/duala-english-parallel-dictionary.json'
target = root / 'packages/translation-engine/src/providers/duala-research-pairs.json'
rows = json.loads(source.read_text(encoding='utf-8'))['entries']
unique = {}
ambiguous = set()
for row in rows:
    if row['domain'] != 'general' or len(row['en']) > 160 or len(row['dua']) > 260:
        continue
    key = ' '.join(row['en'].casefold().split())
    if key in unique and unique[key] != row['dua']:
        ambiguous.add(key)
    unique[key] = row['dua']
for key in ambiguous:
    unique.pop(key, None)
target.write_text(json.dumps(unique, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'{len(unique)} exact research sentences; {len(ambiguous)} ambiguous English sources excluded')
