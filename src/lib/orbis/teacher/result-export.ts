export type ResultExportRow = {
  student: string;
  classroom: string;
  game: string;
  activity: string;
  skill: string;
  correct: number;
  questions: number;
  errors: number;
  hints: number | null;
  durationSeconds: number | null;
  occurredAt: string;
};

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export function resultRowsToCsv(rows: ResultExportRow[]): string {
  const header = ['Élève', 'Classe', 'Jeu', 'Activité', 'Compétence', 'Justes', 'Questions', 'Réussite (%)', 'Erreurs', 'Indices', 'Durée (s)', 'Date'];
  const body = rows.map((row) => [
    row.student,
    row.classroom,
    row.game,
    row.activity,
    row.skill,
    row.correct,
    row.questions,
    row.questions > 0 ? Math.round(row.correct / row.questions * 100) : '',
    row.errors,
    row.hints ?? '',
    row.durationSeconds ?? '',
    row.occurredAt
  ]);
  return [header, ...body].map((row) => row.map(csvCell).join(';')).join('\n');
}

export function safeExportPart(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'resultats';
}

export async function resultRowsToPdf(rows: ResultExportRow[], metadata: {
  filters: string;
  generatedAt: Date;
  totalCorrect: number;
  totalQuestions: number;
}): Promise<ArrayBuffer> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const rate = metadata.totalQuestions > 0 ? Math.round(metadata.totalCorrect / metadata.totalQuestions * 100) : 0;
  const columns = [
    { label: 'Date', width: 23 }, { label: 'Élève', width: 32 }, { label: 'Classe', width: 30 }, { label: 'Jeu', width: 34 },
    { label: 'Activité', width: 42 }, { label: 'Résultat', width: 24 }, { label: 'Erreurs', width: 18 }, { label: 'Indices', width: 17 }, { label: 'Durée', width: 22 }
  ];
  const duration = (seconds: number) => { const minutes = Math.round(seconds / 60); return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`; };
  const drawPageHeader = () => {
    pdf.setTextColor(23, 60, 49); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.text('Orbis — Rapport de résultats', margin, 13);
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(70, 88, 81); pdf.setFontSize(8.5); pdf.text(metadata.filters, margin, 19);
    pdf.text(`Généré le ${metadata.generatedAt.toLocaleString('fr-CH')} · ${rows.length} activité(s) · ${metadata.totalCorrect}/${metadata.totalQuestions} réponses justes (${rate} %)`, margin, 24);
  };
  const drawTableHeader = (top: number) => {
    pdf.setFillColor(229, 238, 229); pdf.rect(margin, top, columns.reduce((sum, column) => sum + column.width, 0), 8, 'F');
    pdf.setTextColor(40, 70, 61); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5);
    let x = margin + 1.5; for (const column of columns) { pdf.text(column.label, x, top + 5.3); x += column.width; }
  };
  drawPageHeader(); let y = 29; drawTableHeader(y); y += 8;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.2); pdf.setTextColor(30, 45, 41);
  for (const row of rows) {
    if (y + 8 > pageHeight - 10) { pdf.addPage(); drawPageHeader(); y = 29; drawTableHeader(y); y += 8; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.2); pdf.setTextColor(30, 45, 41); }
    const values = [
      new Date(row.occurredAt).toLocaleDateString('fr-CH'), row.student, row.classroom, row.game, row.activity,
      `${row.correct}/${row.questions} (${row.questions ? Math.round(row.correct / row.questions * 100) : 0} %)`, String(row.errors), row.hints === null ? '—' : String(row.hints), row.durationSeconds === null ? '—' : duration(row.durationSeconds)
    ];
    let x = margin + 1.5;
    values.forEach((value, index) => { const clipped = pdf.splitTextToSize(value, columns[index].width - 3)[0] ?? ''; pdf.text(clipped, x, y + 5); x += columns[index].width; });
    pdf.setDrawColor(220, 229, 220); pdf.line(margin, y + 7.5, pageWidth - margin, y + 7.5); y += 8;
  }
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) { pdf.setPage(page); pdf.setFontSize(7); pdf.setTextColor(100); pdf.text(`Page ${page}/${pageCount}`, pageWidth - margin, pageHeight - 4, { align: 'right' }); }
  return pdf.output('arraybuffer');
}
