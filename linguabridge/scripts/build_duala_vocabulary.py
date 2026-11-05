#!/usr/bin/env python3
"""Build an exploratory word index from parallel sentences, never a translation lexicon."""
import argparse
from collections import Counter, defaultdict
import json
import math
from pathlib import Path
import unicodedata

SOURCE = Path('linguabridge/docs/research/duala-english-parallel-dictionary.json')
TARGET = Path('linguabridge/docs/research/duala-vocabulary-research.json')


def is_letter(char):
    return unicodedata.category(char).startswith('L')


def tokens(text):
    """Keep combining tone marks with their base and internal apostrophes."""
    text = unicodedata.normalize('NFC', text)
    out, current = [], ''
    for i, char in enumerate(text):
        category = unicodedata.category(char)
        if is_letter(char) or (category.startswith('M') and current):
            current += char
        elif char in "'’" and current and i + 1 < len(text) and is_letter(text[i + 1]):
            current += char
        elif current:
            out.append(current.casefold())
            current = ''
    if current:
        out.append(current.casefold())
    return out


def build(source):
    entries = source['entries']
    duala_count, english_count = Counter(), Counter()
    duala_sentences, english_sentences = Counter(), Counter()
    contexts = defaultdict(list)
    together = defaultdict(Counter)
    for index, pair in enumerate(entries):
        dua, en = tokens(pair['dua']), tokens(pair['en'])
        duala_count.update(dua)
        english_count.update(en)
        dset, eset = set(dua), set(en)
        duala_sentences.update(dset)
        english_sentences.update(eset)
        for word in dset:
            if len(contexts[word]) < 3:
                contexts[word].append(index)
            together[word].update(eset)
    result = []
    for word in sorted(duala_count):
        # Log likelihood ratio against independence, as an exploration aid only.
        candidates = []
        if duala_sentences[word] >= 3:
            for english, joint in together[word].items():
                if joint < 3 or english_sentences[english] < 3:
                    continue
                expected = duala_sentences[word] * english_sentences[english] / len(entries)
                score = joint / expected if expected else 0
                if score >= 2:
                    candidates.append((score, joint, english))
        candidates.sort(key=lambda x: (-x[0], -x[1], x[2]))
        result.append({
            'form': word,
            'occurrences': duala_count[word],
            'sentence_count': duala_sentences[word],
            'example_pair_indices': contexts[word],
            'english_cooccurrences_unverified': [
                {'form': en, 'shared_sentences': joint, 'association_ratio': round(score, 2)}
                for score, joint, en in candidates[:5]
            ],
        })
    return {
        'source': source['source'], 'source_revision': source['source_revision'],
        'source_file': str(SOURCE), 'source_pair_count': len(entries),
        'declared_license': source['declared_license'],
        'status': 'exploratory_unverified_not_for_translation',
        'method': 'Unicode letters and attached combining marks; casefold; phrase cooccurrence ratio, not word alignment',
        'duala_distinct_forms': len(duala_count), 'english_distinct_forms': len(english_count),
        'duala_token_count': sum(duala_count.values()),
        'english_token_count': sum(english_count.values()),
        'entries': result,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=SOURCE)
    parser.add_argument('--output', type=Path, default=TARGET)
    args = parser.parse_args()
    source = json.loads(args.source.read_text(encoding='utf-8'))
    result = build(source)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: result[key] for key in ('source_pair_count', 'duala_distinct_forms', 'english_distinct_forms', 'duala_token_count')}))

if __name__ == '__main__':
    main()
