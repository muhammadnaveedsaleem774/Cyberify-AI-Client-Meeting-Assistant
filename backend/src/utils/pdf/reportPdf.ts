import PDFDocument from 'pdfkit';

export type PdfSectionItem = {
  label: string;
  value: string;
};

export function truncateText(value: unknown, maxLength = 240) {
  const text = value === null || value === undefined ? '' : String(value).trim();
  if (!text) return 'N/A';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function ensureSpace(doc: PDFKit.PDFDocument, needed = 80) {
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottomLimit) {
    doc.addPage();
  }
}

export function sectionHeading(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  ensureSpace(doc, subtitle ? 80 : 60);
  doc.moveDown(0.5);
  doc.fontSize(14).fillColor('#0f172a').text(title, { underline: false });
  if (subtitle) {
    doc.fontSize(9).fillColor('#64748b').text(subtitle);
  }
  doc.moveDown(0.4);
}

export function keyValueLine(doc: PDFKit.PDFDocument, label: string, value: unknown) {
  doc.fontSize(10).fillColor('#334155').text(`${label}: ${truncateText(value, 280)}`);
}

export function listItems(doc: PDFKit.PDFDocument, items: string[], emptyLabel = 'No data available.', maxLength = 220) {
  if (!items.length) {
    doc.fontSize(10).fillColor('#64748b').text(emptyLabel);
    return;
  }
  for (const item of items) {
    ensureSpace(doc, 32);
    doc.fontSize(10).fillColor('#334155').text(`• ${truncateText(item, maxLength)}`);
  }
}

export function sectionTableLike(doc: PDFKit.PDFDocument, rows: PdfSectionItem[], emptyLabel = 'No data available.') {
  if (!rows.length) {
    doc.fontSize(10).fillColor('#64748b').text(emptyLabel);
    return;
  }
  for (const row of rows) {
    ensureSpace(doc, 30);
    doc.fontSize(10).fillColor('#0f172a').text(row.label, { continued: true });
    doc.fillColor('#334155').text(`: ${truncateText(row.value, 280)}`);
  }
}

export function writeDocHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  doc.fontSize(18).fillColor('#0f172a').text(title, { align: 'center' });
  if (subtitle) {
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#64748b').text(subtitle, { align: 'center' });
  }
  doc.moveDown(1);
}
