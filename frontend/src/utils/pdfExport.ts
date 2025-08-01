import jsPDF from "jspdf";
import { marked } from "marked";

// Helpers for format
function ensureSpace(doc: jsPDF, y: number, neededHeight: number): number {
  if (y + neededHeight > 280) {
    doc.addPage();
    return 10;
  }
  return y;
}

function parseMarkdownToPDF(doc: jsPDF, markdown: string, yStart: number): number {
  const tokens = marked.lexer(markdown);
  let y = yStart;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Handle headers with "anti-widow" logic
    if (token.type === "heading") {
      const next = tokens[i + 1];
      const estimatedHeight = 10 + (next?.type === "paragraph"
        ? doc.splitTextToSize(next.text, 180).length * 8
        : next?.type === "list"
        ? next.items.length * 10
        : 0);

      y = ensureSpace(doc, y, estimatedHeight);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(token.depth === 1 ? 16 : 14);
      doc.text(token.text, 10, y);
      y += 10;
      continue;
    }

    if (token.type === "paragraph") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const paraLines = doc.splitTextToSize(token.text, 180);
      y = ensureSpace(doc, y, paraLines.length * 8);
      doc.text(paraLines, 10, y);
      y += paraLines.length * 8 + 2;
      continue;
    }

    if (token.type === "list") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      for (const item of token.items) {
        const bulletLines = doc.splitTextToSize(`• ${item.text}`, 180);
        y = ensureSpace(doc, y, bulletLines.length * 8);
        doc.text(bulletLines, 10, y);
        y += bulletLines.length * 8 + 2;
      }
      y += 2;
      continue;
    }

    if (token.type === "space") {
      y += 5;
      continue;
    }
  }

  return y;
}


// ========== MAIN EXPORT FUNCTIONS ==========

export function exportSummaryPDF(summary: string, executiveSummary: string) {
  const doc = new jsPDF();
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Executive Summary", 10, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const execLines = doc.splitTextToSize(executiveSummary, 180);
  doc.text(execLines, 10, y);

  y += execLines.length *5;
  y = ensureSpace(doc, y, 20); // Ensure enough space before next section
  y += 6; // Controlled vertical padding
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Summary", 10, y);
  y += 10;
  

  y = parseMarkdownToPDF(doc, summary, y);

  doc.save("summary.pdf");
}

export function exportBulletsPDF(slideBullets: string) {
  const doc = new jsPDF();
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Slide Bullets", 10, y);
  y += 10;

  y = parseMarkdownToPDF(doc, slideBullets, y);

  doc.save("slide_bullets.pdf");
}
