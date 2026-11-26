#!/usr/bin/env python3
"""Generate the local Piper pronunciation files for Deutsch Werkstatt.

The model is intentionally provided through PIPER_MODEL and is not committed
to the repository. The generated WAV files are the runtime assets.
"""

import argparse
import json
import os
import wave
from pathlib import Path

from piper import PiperVoice
from piper.config import SynthesisConfig


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "static" / "audio" / "deutsch-werkstatt" / "thorsten-130"
WORDS = [
    ("computer", "der Computer"),
    ("keyboard", "die Tastatur"),
    ("screen", "der Bildschirm"),
    ("file", "die Datei"),
    ("to-download", "herunterladen"),
    ("to-save", "speichern"),
    ("train", "der Zug"),
    ("workshop", "die Werkstatt"),
    ("machine", "die Maschine"),
    ("safety", "die Sicherheit"),
    ("number", "die Zahl"),
    ("to-open", "öffnen"),
]

parser = argparse.ArgumentParser()
parser.add_argument("--model", default=os.environ.get("PIPER_MODEL"))
parser.add_argument("--length-scale", type=float, default=1.30)
args = parser.parse_args()

if not args.model:
    raise SystemExit("Définis PIPER_MODEL ou utilise --model avec un fichier .onnx.")

OUTPUT.mkdir(parents=True, exist_ok=True)
voice = PiperVoice.load(args.model)
config = SynthesisConfig(length_scale=args.length_scale)

for word_id, text in WORDS:
    destination = OUTPUT / f"{word_id}.wav"
    with wave.open(str(destination), "wb") as wav_file:
        voice.synthesize_wav(text, wav_file, syn_config=config)

manifest = {
    "voice": "de_DE-thorsten-medium",
    "lengthScale": args.length_scale,
    "sampleRate": 22050,
    "words": [word_id for word_id, _ in WORDS],
}
(OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{len(WORDS)} fichiers Piper allemands générés dans {OUTPUT}")
