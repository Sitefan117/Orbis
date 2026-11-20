#!/usr/bin/env python3
"""Generate one Piper WAV pronunciation for every English Lab entry."""

import csv
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

if not MODEL:
    raise SystemExit("Définis PIPER_MODEL avec le chemin du modèle Piper anglais.")

OUTPUT.mkdir(parents=True, exist_ok=True)
voice = PiperVoice.load(MODEL)
config = SynthesisConfig(length_scale=1.08)

with SOURCE.open(encoding="utf-8", newline="") as source_file:
    rows = list(csv.DictReader(source_file))

for index, row in enumerate(rows, start=1):
    destination = OUTPUT / f"{row['id']}-piper.wav"
    with wave.open(str(destination), "wb") as wav_file:
        voice.synthesize_wav(row["mot"], wav_file, syn_config=config)
    if index % 25 == 0 or index == len(rows):
        print(f"{index}/{len(rows)} fichiers Piper anglais générés", flush=True)

manifest = {"voices": ["piper-en-GB-alan"], "words": [row["id"] for row in rows]}
(OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")
