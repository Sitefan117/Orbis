#!/usr/bin/env python3
"""Generate one Piper WAV pronunciation for every English Lab entry."""

import csv
import argparse
import json
import os
from pathlib import Path
import wave

from piper import PiperVoice
from piper.config import SynthesisConfig


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "static" / "vocabulaire" / "english-lab.csv"
OUTPUT = ROOT / "static" / "audio" / "english-lab"
MODEL = os.environ.get("PIPER_MODEL")

parser = argparse.ArgumentParser()
parser.add_argument("--ids", nargs="*", help="Ne régénérer que ces identifiants (le manifeste reste complet).")
parser.add_argument("--prefix", action="append", default=[], help="Ne régénérer que les identifiants commençant par ce préfixe.")
args = parser.parse_args()

if not MODEL:
    raise SystemExit("Définis PIPER_MODEL avec le chemin du modèle Piper anglais.")

OUTPUT.mkdir(parents=True, exist_ok=True)
voice = PiperVoice.load(MODEL)
config = SynthesisConfig(length_scale=1.08)

with SOURCE.open(encoding="utf-8", newline="") as source_file:
    rows = list(csv.DictReader(source_file))

selected_rows = rows if not args.ids and not args.prefix else [
    row for row in rows if row["id"] in set(args.ids or []) or any(row["id"].startswith(prefix) for prefix in args.prefix)
]
missing_ids = set(args.ids or []) - {row["id"] for row in selected_rows}
if missing_ids:
    raise SystemExit(f"Identifiants absents du lexique : {', '.join(sorted(missing_ids))}")

for index, row in enumerate(selected_rows, start=1):
    destination = OUTPUT / f"{row['id']}-piper.wav"
    with wave.open(str(destination), "wb") as wav_file:
        voice.synthesize_wav(row["mot"], wav_file, syn_config=config)
    if index % 25 == 0 or index == len(selected_rows):
        print(f"{index}/{len(selected_rows)} fichiers Piper anglais générés", flush=True)

manifest = {"voices": ["piper-en-GB-alan"], "words": [row["id"] for row in rows]}
(OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")
