/** Encode une cellule destinée à être ouverte dans un tableur. */
export function csvCell(value: unknown): string {
  const text = String(value ?? '');
  // Excel peut interpréter une formule même après des espaces. Le tabulateur
  // placé dans la cellule citée force une lecture comme texte à l'ouverture.
  const safeText = /^[\s\uFEFF]*[=+\-@＝＋－＠]/u.test(text) ? `\t${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}
