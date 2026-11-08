import re

def split_into_acoustic_clauses(text: str) -> list[str]:
    clean = text.strip()
    if not clean:
        return []
    if len(clean) <= 48:
        return [clean]

    clauses = []
    # Split on whitespace following punctuation
    parts = re.split(r'(?<=[.!?;:,])\s+', clean)
    current = ""

    for part in parts:
        if not part:
            continue
        candidate = f"{current} {part}".strip() if current else part
        if len(candidate) <= 48:
            current = candidate
        else:
            if current:
                clauses.append(current.strip())
            if len(part) <= 48:
                current = part
            else:
                words = part.split()
                sub = ""
                for w in words:
                    cand_sub = f"{sub} {w}".strip() if sub else w
                    if len(cand_sub) <= 45:
                        sub = cand_sub
                    else:
                        if sub:
                            clauses.append(sub.strip())
                        sub = w
                current = sub
    if current and current.strip():
        clauses.append(current.strip())
    return [c for c in clauses if len(c) > 0]

samples = [
    "Mbolo, moni wa a ne mvae",
    "Bienvenue sur la plateforme Nayokan pour apprendre les langues et technologies africaines en toute serenite.",
    "Barka da zuwa shafin yanar gizo na banki domin yin duk wani hada-hadar kudi cikin sauki da aminci.",
    "Jam waali e kooje fuu, en ngoodi hebugo seede e laawol kesol ngol hokkata jam.",
]

for s in samples:
    chunks = split_into_acoustic_clauses(s)
    print(f"\nOriginal ({len(s)} chars): {s}")
    for idx, c in enumerate(chunks):
        print(f"  Chunk {idx} ({len(c)} chars): '{c}'")
