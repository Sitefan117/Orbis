#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${ORBIS_SUPABASE_DB_URL:-}" ]]; then
  echo "ORBIS_SUPABASE_DB_URL manque. Copie la chaîne de connexion directe depuis Supabase, puis relance la commande." >&2
  exit 1
fi

backup_dir="${ORBIS_BACKUP_DIR:-backups/supabase}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="${backup_dir}/orbis-public-${timestamp}.sql"
mkdir -p "$backup_dir"
umask 077

# Le CLI Supabase fournit la version de pg_dump compatible avec le projet hébergé.
# Ce dump logique couvre le schéma et les données applicatives publiques. Les mots
# de passe Auth ne sont jamais exportés et devront être recréés après un sinistre.
npx --yes supabase@latest db dump --db-url "$ORBIS_SUPABASE_DB_URL" --file "$target"
npx --yes supabase@latest db dump --db-url "$ORBIS_SUPABASE_DB_URL" --data-only --use-copy --file "${target%.sql}-data.sql"

echo "Sauvegarde créée : $target"
echo "Données créées : ${target%.sql}-data.sql"
echo "Conserve ces fichiers dans un emplacement chiffré distinct de l’ordinateur et teste régulièrement une restauration."
