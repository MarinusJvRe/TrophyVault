import type { Trophy, Weapon } from "@shared/schema";

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateProofOfHunt(
  trophy: Trophy,
  weapon: Weapon | null | undefined
) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const COPPER = "#b87333";
  const DARK = "#1a1a1a";
  const CREAM = "#f5f0e6";
  const MUTED = "#a09b91";

  ctx.fillStyle = DARK;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = COPPER;
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, W - 40, H - 40);
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  let y = 60;

  ctx.fillStyle = COPPER;
  ctx.font = "bold 16px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("HONOR THE HUNT", W / 2, y);
  y += 8;

  ctx.strokeStyle = COPPER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 80, y);
  ctx.lineTo(W / 2 + 80, y);
  ctx.stroke();
  y += 30;

  ctx.fillStyle = CREAM;
  ctx.font = "bold 32px Georgia, serif";
  ctx.fillText("PROOF OF HUNT", W / 2, y);
  y += 20;

  ctx.fillStyle = MUTED;
  ctx.font = "14px Georgia, serif";
  ctx.fillText("This certifies the following hunting achievement", W / 2, y);
  y += 30;

  if (trophy.imageUrl) {
    try {
      const img = await loadImage(trophy.imageUrl);
      const imgAreaW = W - 120;
      const imgAreaH = 480;
      const imgX = 60;
      const imgY = y;

      ctx.save();
      drawRoundedRect(ctx, imgX, imgY, imgAreaW, imgAreaH, 12);
      ctx.clip();

      const scale = Math.max(imgAreaW / img.width, imgAreaH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = imgX + (imgAreaW - drawW) / 2;
      const drawY = imgY + (imgAreaH - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      ctx.strokeStyle = COPPER;
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, imgX, imgY, imgAreaW, imgAreaH, 12);
      ctx.stroke();

      y += imgAreaH + 30;
    } catch {
      y += 20;
    }
  }

  ctx.fillStyle = CREAM;
  ctx.font = "bold 40px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(trophy.species.toUpperCase(), W / 2, y);
  y += 10;

  if (trophy.gender) {
    ctx.fillStyle = COPPER;
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText(trophy.gender.charAt(0).toUpperCase() + trophy.gender.slice(1), W / 2, y + 16);
    y += 24;
  }

  if (trophy.name) {
    y += 8;
    ctx.fillStyle = CREAM;
    ctx.font = "italic 22px Georgia, serif";
    ctx.fillText(`"${trophy.name}"`, W / 2, y + 16);
    y += 28;
  }

  y += 12;
  ctx.strokeStyle = COPPER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, y);
  ctx.lineTo(W - 120, y);
  ctx.stroke();
  y += 30;

  const details: { label: string; value: string }[] = [];
  if (trophy.date) details.push({ label: "DATE", value: trophy.date });
  if (trophy.location) details.push({ label: "LOCATION", value: trophy.location });
  if (trophy.score) details.push({ label: "SCORE", value: trophy.score });
  if (trophy.method) details.push({ label: "METHOD", value: trophy.method });
  if (weapon) {
    const wText = `${weapon.name}${weapon.caliber ? ` (${weapon.caliber})` : ""}`;
    details.push({ label: "WEAPON", value: wText });
  }
  if (trophy.shotDistance) details.push({ label: "SHOT DISTANCE", value: trophy.shotDistance });

  const cols = 2;
  const colW = (W - 120) / cols;
  const startX = 60;

  details.forEach((d, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * colW + 20;
    const rowY = y + row * 56;

    ctx.textAlign = "left";
    ctx.fillStyle = MUTED;
    ctx.font = "12px Georgia, serif";
    ctx.fillText(d.label, x, rowY);

    ctx.fillStyle = CREAM;
    ctx.font = "bold 18px Georgia, serif";
    const maxTextW = colW - 40;
    const truncated = truncateText(ctx, d.value, maxTextW);
    ctx.fillText(truncated, x, rowY + 22);
  });

  const detailRows = Math.ceil(details.length / cols);
  y += detailRows * 56 + 10;

  if (trophy.notes) {
    ctx.strokeStyle = COPPER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, y);
    ctx.lineTo(W - 120, y);
    ctx.stroke();
    y += 24;

    ctx.textAlign = "center";
    ctx.fillStyle = COPPER;
    ctx.font = "bold 13px Georgia, serif";
    ctx.fillText("TROPHY NOTES", W / 2, y);
    y += 18;

    ctx.fillStyle = CREAM;
    ctx.font = "italic 15px Georgia, serif";
    const noteLines = wrapText(ctx, `"${trophy.notes}"`, W - 160);
    noteLines.forEach((line) => {
      ctx.fillText(line, W / 2, y);
      y += 20;
    });
    y += 4;
  }

  const footerY = H - 60;
  ctx.strokeStyle = COPPER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, footerY - 16);
  ctx.lineTo(W - 200, footerY - 16);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  ctx.font = "12px Georgia, serif";
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ctx.fillText(`Generated on ${dateStr}`, W / 2, footerY);

  ctx.fillStyle = COPPER;
  ctx.font = "bold 14px Georgia, serif";
  ctx.fillText("honorthehunt.ai", W / 2, footerY + 20);

  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Failed to generate image")); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HonorTheHunt_${trophy.species.replace(/\s+/g, "_")}_${trophy.date || "proof"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxW) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
