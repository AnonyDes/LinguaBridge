#!/usr/bin/env python3
"""
LinguaBridge Multi-Agent Hub Active Watcher Daemon
==================================================
Maintains continuous active observation of MULTI_AGENT_HUB.md.
- Tracks changes in real-time (polling every 1.5s).
- Extracts and announces all new messages, replies, and task updates.
- Maintains bi-directional synchronization between workspace copies.
- Persists state and logs to logs/agent_hub_watcher.log.
"""
import os
import sys
import time
import io
import json
import hashlib
from pathlib import Path
from datetime import datetime

# Enforce UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Determine paths dynamically
BASE_DIR = Path(__file__).resolve().parent
while BASE_DIR.name and BASE_DIR.name != "focused-maxwell" and BASE_DIR.parent != BASE_DIR:
    BASE_DIR = BASE_DIR.parent

if not (BASE_DIR / "MULTI_AGENT_HUB.md").exists():
    BASE_DIR = Path(r"C:\Users\LENOVO\Documents\antigravity\focused-maxwell")

HUB_ROOT = BASE_DIR / "MULTI_AGENT_HUB.md"
HUB_SUB = BASE_DIR / "linguabridge" / "MULTI_AGENT_HUB.md"
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)
WATCH_LOG = LOG_DIR / "agent_hub_watcher.log"
STATE_FILE = LOG_DIR / "hub_state.json"

def get_file_hash(path: Path) -> str:
    if not path.exists():
        return ""
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except Exception:
        return ""

def log(msg: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] [HubWatcher] {msg}"
    print(formatted, flush=True)
    try:
        with open(WATCH_LOG, "a", encoding="utf-8") as f:
            f.write(formatted + "\n")
    except Exception:
        pass

def parse_entries(content: str):
    marker = "## 💬 4. Journal des Échanges"
    if marker not in content:
        return []
    section = content.split(marker)[-1]
    raw_entries = section.split("#### ")
    entries = []
    for e in raw_entries:
        cleaned = e.strip()
        if cleaned and not cleaned.startswith("### "):
            entries.append("#### " + cleaned)
    return entries

def load_known_entries() -> set:
    if STATE_FILE.exists():
        try:
            data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            return set(data.get("known_hashes", []))
        except Exception:
            pass
    return set()

def save_state(known_hashes: set, file_hash: str):
    try:
        data = {
            "last_updated": datetime.now().isoformat(),
            "file_hash": file_hash,
            "known_hashes": list(known_hashes)
        }
        STATE_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception:
        pass

def hash_text(text: str) -> str:
    return hashlib.md5(text.strip().encode("utf-8")).hexdigest()

def main():
    log("=================================================================")
    log("🌐 DÉMARRAGE DU DAEMON MULTI-AGENT HUB WATCHER")
    log(f"📁 Fichier Hub Principal : {HUB_ROOT}")
    log(f"📁 Copie Synchronisée  : {HUB_SUB}")
    log(f"📝 Journal d'activité  : {WATCH_LOG}")
    log("=================================================================")

    if not HUB_ROOT.exists():
        log(f"❌ ERREUR : Le fichier {HUB_ROOT} n'existe pas !")
        sys.exit(1)

    known_hashes = load_known_entries()
    last_root_hash = get_file_hash(HUB_ROOT)
    last_sub_hash = get_file_hash(HUB_SUB)

    # Initial scan of existing entries
    initial_content = HUB_ROOT.read_text(encoding="utf-8")
    initial_entries = parse_entries(initial_content)
    is_first_run = len(known_hashes) == 0

    for entry in initial_entries:
        h = hash_text(entry)
        if is_first_run:
            known_hashes.add(h)

    if is_first_run:
        save_state(known_hashes, last_root_hash)
        log(f"ℹ️ État initial mémorisé : {len(known_hashes)} entrées existantes au compteur.")
        if initial_entries:
            log("📌 Dernier message en cours sur le Hub :")
            print("-" * 65, flush=True)
            print(initial_entries[-1], flush=True)
            print("-" * 65, flush=True)

    log("👀 En veille active permanente. Toute nouvelle intervention sera lue et relayée instantanément...")

    while True:
        try:
            curr_root_hash = get_file_hash(HUB_ROOT)
            curr_sub_hash = get_file_hash(HUB_SUB)

            # 1. Detect change in Root Hub
            if curr_root_hash and curr_root_hash != last_root_hash:
                log("🔔 [DÉTECTION] Modification détectée sur MULTI_AGENT_HUB.md !")
                content = HUB_ROOT.read_text(encoding="utf-8")
                
                # Auto-sync to linguabridge/
                if HUB_SUB.parent.exists():
                    try:
                        HUB_SUB.write_text(content, encoding="utf-8")
                        curr_sub_hash = get_file_hash(HUB_SUB)
                        last_sub_hash = curr_sub_hash
                        log("🔄 [SYNCHRO] MULTI_AGENT_HUB.md répercuté vers linguabridge/")
                    except Exception as e:
                        log(f"⚠️ Erreur synchro vers sous-dossier : {e}")

                # Detect and display new entries
                current_entries = parse_entries(content)
                new_found = 0
                for entry in current_entries:
                    eh = hash_text(entry)
                    if eh not in known_hashes:
                        known_hashes.add(eh)
                        new_found += 1
                        log(f"📢 [NOUVEAU MESSAGE DÉTECTÉ (#{new_found})] :")
                        print("=" * 65, flush=True)
                        print(entry, flush=True)
                        print("=" * 65, flush=True)

                if new_found == 0:
                    log("ℹ️ Modification du Hub (tableau de bord, statut ou refonte de section).")

                last_root_hash = curr_root_hash
                save_state(known_hashes, curr_root_hash)

            # 2. Detect change in Subfolder Hub (bi-directional sync)
            elif curr_sub_hash and curr_sub_hash != last_sub_hash:
                log("🔔 [DÉTECTION] Modification dans linguabridge/MULTI_AGENT_HUB.md -> Synchronisation vers la racine...")
                sub_content = HUB_SUB.read_text(encoding="utf-8")
                HUB_ROOT.write_text(sub_content, encoding="utf-8")
                curr_root_hash = get_file_hash(HUB_ROOT)
                last_root_hash = curr_root_hash
                last_sub_hash = curr_sub_hash

                current_entries = parse_entries(sub_content)
                for entry in current_entries:
                    eh = hash_text(entry)
                    if eh not in known_hashes:
                        known_hashes.add(eh)
                        log("📢 [NOUVEAU MESSAGE DÉTECTÉ (via sous-dossier)] :")
                        print("=" * 65, flush=True)
                        print(entry, flush=True)
                        print("=" * 65, flush=True)
                save_state(known_hashes, curr_root_hash)

            time.sleep(1.5)

        except KeyboardInterrupt:
            log("🛑 Arrêt manuel du Hub Watcher.")
            break
        except Exception as err:
            log(f"⚠️ Erreur de boucle : {err}")
            time.sleep(3)

if __name__ == "__main__":
    main()
