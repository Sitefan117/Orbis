#!/bin/sh
# Compile les modules de conjugaison dans un dossier temporaire puis lance les tests.
# Le dossier temporaire est supprimé automatiquement, même si le test échoue.
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT INT TERM

cd "$ROOT_DIR"

# Utilise TypeScript du projet ORBIS (npx choisit le paquet local lorsqu’il existe).
npx tsc \
  --strict \
  --noUnusedLocals \
  --noUnusedParameters \
  --target ES2022 \
  --module commonjs \
  --moduleResolution node \
  --esModuleInterop \
  --outDir "$BUILD_DIR" \
  src/lib/conju-lab/types.ts \
  src/lib/conju-lab/verbs.ts \
  src/lib/conju-lab/curriculum.ts \
  src/lib/conju-lab/question-engine.ts

CONJULAB_BUILD_DIR="$BUILD_DIR" node tests/conju-lab-engine-smoke.cjs
