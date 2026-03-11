import jsPDF from "jspdf";
import type { Trophy, Weapon } from "@shared/schema";
import { getAllThresholds } from "@shared/scoring-thresholds";

const COPPER = [184, 115, 51] as const;
const DARK_BG = [26, 26, 26] as const;
const CREAM = [245, 240, 230] as const;
const MUTED = [160, 155, 145] as const;
const WHITE = [255, 255, 255] as const;

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateTrophyCertificate(
  trophy: Trophy,
  weapon: Weapon | null | undefined
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  doc.setLineWidth(0.3);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  let y = 25;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COPPER);
  doc.text("TROPHY VAULT", pageWidth / 2, y, { align: "center" });
  y += 4;

  doc.setLineWidth(0.5);
  doc.setDrawColor(...COPPER);
  const lineW = 40;
  doc.line(pageWidth / 2 - lineW / 2, y, pageWidth / 2 + lineW / 2, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...CREAM);
  doc.text("TROPHY CERTIFICATE", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("This certifies the following hunting achievement", pageWidth / 2, y, { align: "center" });
  y += 10;

  if (trophy.imageUrl) {
    const imageData = await loadImageAsDataUrl(trophy.imageUrl);
    if (imageData) {
      const imgSize = 60;
      const imgX = (pageWidth - imgSize) / 2;
      doc.setDrawColor(...COPPER);
      doc.setLineWidth(0.5);
      doc.roundedRect(imgX - 1, y - 1, imgSize + 2, imgSize + 2, 2, 2);
      try {
        doc.addImage(imageData, "JPEG", imgX, y, imgSize, imgSize);
      } catch {
        doc.setFillColor(40, 40, 40);
        doc.roundedRect(imgX, y, imgSize, imgSize, 2, 2, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text("Photo", pageWidth / 2, y + imgSize / 2, { align: "center" });
      }
      y += imgSize + 8;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...CREAM);
  const speciesText = trophy.species.toUpperCase();
  doc.text(speciesText, pageWidth / 2, y, { align: "center" });
  y += 6;

  if (trophy.gender) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COPPER);
    doc.text(trophy.gender.charAt(0).toUpperCase() + trophy.gender.slice(1), pageWidth / 2, y, { align: "center" });
    y += 5;
  }

  if (trophy.name) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(...CREAM);
    doc.text(`"${trophy.name}"`, pageWidth / 2, y, { align: "center" });
    y += 8;
  }

  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.3);
  doc.line(margin + 20, y, pageWidth - margin - 20, y);
  y += 8;

  const detailStartY = y;
  const colWidth = contentWidth / 2;

  function drawDetail(label: string, value: string, col: number, rowY: number) {
    const x = margin + (col === 0 ? 5 : colWidth + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x, rowY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...CREAM);
    doc.text(value, x, rowY + 5);
  }

  let detailY = detailStartY;

  drawDetail("Date", trophy.date || "—", 0, detailY);
  if (trophy.location) {
    drawDetail("Location", trophy.location, 1, detailY);
  }
  detailY += 14;

  if (trophy.score) {
    drawDetail("Score / Size", trophy.score, 0, detailY);
  }
  if (trophy.method) {
    drawDetail("Method", trophy.method, 1, detailY);
  }
  detailY += 14;

  if (weapon) {
    const weaponText = `${weapon.name}${weapon.caliber ? ` (${weapon.caliber})` : ""}`;
    drawDetail("Weapon", weaponText, 0, detailY);
  }
  if (trophy.shotDistance) {
    drawDetail("Shot Distance", trophy.shotDistance, 1, detailY);
  }
  detailY += 14;

  y = detailY;

  const thresholds = getAllThresholds(trophy.species);
  if (thresholds) {
    doc.setDrawColor(...COPPER);
    doc.setLineWidth(0.3);
    doc.line(margin + 20, y, pageWidth - margin - 20, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COPPER);
    doc.text("SCORING THRESHOLDS", pageWidth / 2, y, { align: "center" });
    y += 6;

    const systems = [
      { label: "SCI", value: thresholds.sci },
      { label: "Rowland Ward", value: thresholds.rowlandWard },
      { label: "B&C", value: thresholds.booneAndCrockett },
    ].filter(s => s.value && s.value !== "n/a");

    if (systems.length > 0) {
      const colW = contentWidth / systems.length;
      systems.forEach((sys, i) => {
        const x = margin + colW * i + colW / 2;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...MUTED);
        doc.text(sys.label, x, y, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...CREAM);
        doc.text(sys.value || "—", x, y + 5, { align: "center" });
      });
      y += 14;
    }
  }

  if (trophy.notes) {
    doc.setDrawColor(...COPPER);
    doc.setLineWidth(0.3);
    doc.line(margin + 20, y, pageWidth - margin - 20, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COPPER);
    doc.text("TROPHY NOTES", pageWidth / 2, y, { align: "center" });
    y += 5;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...CREAM);
    const noteLines = doc.splitTextToSize(`"${trophy.notes}"`, contentWidth - 20);
    doc.text(noteLines, pageWidth / 2, y, { align: "center" });
    y += noteLines.length * 4 + 4;
  }

  if (trophy.huntNotes) {
    if (!trophy.notes) {
      doc.setDrawColor(...COPPER);
      doc.setLineWidth(0.3);
      doc.line(margin + 20, y, pageWidth - margin - 20, y);
      y += 6;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COPPER);
    doc.text("HUNT NOTES", pageWidth / 2, y, { align: "center" });
    y += 5;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...CREAM);
    const huntLines = doc.splitTextToSize(`"${trophy.huntNotes}"`, contentWidth - 20);
    doc.text(huntLines, pageWidth / 2, y, { align: "center" });
    y += huntLines.length * 4 + 4;
  }

  const footerY = pageHeight - 20;
  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.3);
  doc.line(margin + 30, footerY - 8, pageWidth - margin - 30, footerY - 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(
    `Generated by Honor The Hunt on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    pageWidth / 2,
    footerY - 2,
    { align: "center" }
  );
  doc.text("honorhunt.app", pageWidth / 2, footerY + 2, { align: "center" });

  const filename = `HonorTheHunt_${trophy.species.replace(/\s+/g, "_")}_${trophy.date || "certificate"}.pdf`;
  doc.save(filename);
}
