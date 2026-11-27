#!/usr/bin/env python3
"""Generate Piper Thorsten audio for the German Musée des mots list."""

import argparse
import csv
import json
import os
import wave
from pathlib import Path

from piper import PiperVoice
from piper.config import SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "src" / "lib" / "deutsch-werkstatt" / "musee-de.csv"
OUTPUT = ROOT / "static" / "audio" / "deutsch-werkstatt" / "museum-thorsten-130"

parser = argparse.ArgumentParser()
parser.add_argument("--model", default=os.environ.get("PIPER_MODEL"))
parser.add_argument("--length-scale", type=float, default=1.30)
args = parser.parse_args()
if not args.model:
    raise SystemExit("Définis PIPER_MODEL ou utilise --model avec un fichier .onnx.")

OUTPUT.mkdir(parents=True, exist_ok=True)
voice = PiperVoice.load(args.model)
config = SynthesisConfig(length_scale=args.length_scale)
with SOURCE.open(encoding="utf-8", newline="") as source:
    entries = list(csv.DictReader(source))

for entry in entries:
    destination = OUTPUT / f"{entry['id']}.wav"
    with wave.open(str(destination), "wb") as wav_file:
        voice.synthesize_wav(entry["allemand"], wav_file, syn_config=config)

(OUTPUT / "manifest.json").write_text(
    json.dumps({
        "voice": "de_DE-thorsten-medium",
        "lengthScale": args.length_scale,
        "sampleRate": 22050,
        "source": "Musée des mots",
        "words": [entry["id"] for entry in entries],
    }, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"{len(entries)} fichiers Piper allemands générés dans {OUTPUT}")
