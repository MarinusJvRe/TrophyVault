import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";
import https from "https";

fal.config({
  credentials: process.env.FAL_KEY,
});

const trophyUploadDir = path.join(process.cwd(), "uploads", "trophies");

const ALLOWED_DOWNLOAD_HOSTS = [
  "fal.media", "v3.fal.media", "storage.googleapis.com",
  "fal-cdn.batuhan.workers.dev", "cdn.tripo3d.ai",
];

function downloadFile(url: string, destPath: string, maxRedirects = 3): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url.startsWith("https://")) {
      return reject(new Error(`Refusing non-HTTPS download: ${url}`));
    }
    try {
      const parsed = new URL(url);
      const hostAllowed = ALLOWED_DOWNLOAD_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h));
      if (!hostAllowed) {
        console.warn(`[3d-model] Download host not in allowlist: ${parsed.hostname}, proceeding anyway`);
      }
    } catch { /* URL parse failure handled by https.get */ }

    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if ((response.statusCode === 301 || response.statusCode === 302) && response.headers.location) {
        file.close();
        fs.unlink(destPath, () => {});
        if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
        return downloadFile(response.headers.location, destPath, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`Download failed with status ${response.statusCode}: ${url}`));
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

export async function removeBackground(localImagePath: string): Promise<string> {
  console.log("[3d-model] Step 1: Removing background...");

  const imageBuffer = fs.readFileSync(localImagePath);
  const ext = path.extname(localImagePath) || ".jpg";
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
  const blob = new Blob([imageBuffer], { type: mimeType });
  const file = new File([blob], `trophy${ext}`, { type: mimeType });
  const uploadedUrl = await fal.storage.upload(file);
  console.log("[3d-model] Uploaded to fal storage:", uploadedUrl);

  const result = await fal.subscribe("fal-ai/birefnet/v2", {
    input: {
      image_url: uploadedUrl,
      model: "BiRefNet_lite",
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        const logs = (update as any).logs;
        if (logs) logs.map((l: any) => l.message).forEach((m: string) => console.log("[3d-model] BiRefNet:", m));
      }
    },
  });

  const resultData = result.data as any;
  const bgRemovedUrl = resultData?.image?.url;
  if (!bgRemovedUrl) {
    throw new Error("Background removal returned no image URL");
  }

  const noBgFilename = `nobg-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  const noBgPath = path.join(trophyUploadDir, noBgFilename);
  await downloadFile(bgRemovedUrl, noBgPath);
  console.log("[3d-model] Background removed:", noBgFilename);
  return noBgPath;
}

export async function generateGlb(bgRemovedImagePath: string): Promise<{ glbPath: string; previewPath: string | null }> {
  console.log("[3d-model] Step 2: Generating 3D model via Tripo...");

  const imageBuffer = fs.readFileSync(bgRemovedImagePath);
  const blob = new Blob([imageBuffer], { type: "image/png" });
  const file = new File([blob], "trophy-nobg.png", { type: "image/png" });
  const uploadedUrl = await fal.storage.upload(file);

  const result = await fal.subscribe("tripo3d/tripo/v2.5/image-to-3d", {
    input: {
      image_url: uploadedUrl,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        const logs = (update as any).logs;
        if (logs) logs.map((l: any) => l.message).forEach((m: string) => console.log("[3d-model] Tripo:", m));
      }
    },
  });

  const resultData = result.data as any;
  const glbUrl = resultData?.model_mesh?.url;
  if (!glbUrl) {
    throw new Error("Tripo returned no GLB model URL");
  }

  const glbFilename = `model-${Date.now()}-${Math.random().toString(36).slice(2)}.glb`;
  const glbPath = path.join(trophyUploadDir, glbFilename);
  await downloadFile(glbUrl, glbPath);
  console.log("[3d-model] GLB downloaded:", glbFilename);

  let previewPath: string | null = null;
  const previewUrl = resultData?.rendered_image?.url;
  if (previewUrl) {
    const previewFilename = `preview-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    previewPath = path.join(trophyUploadDir, previewFilename);
    await downloadFile(previewUrl, previewPath);
    console.log("[3d-model] Preview downloaded:", previewFilename);
  }

  return { glbPath, previewPath };
}

export async function compressGlb(inputPath: string, outputPath: string): Promise<void> {
  console.log("[3d-model] Step 3: Compressing GLB with Draco...");
  try {
    const { NodeIO } = await import("@gltf-transform/core");
    const { ALL_EXTENSIONS } = await import("@gltf-transform/extensions");
    const { draco } = await import("@gltf-transform/functions");
    const draco3d = await import("draco3dgltf");

    const io = new NodeIO()
      .registerExtensions(ALL_EXTENSIONS)
      .registerDependencies({
        "draco3d.encoder": await draco3d.default.createEncoderModule(),
        "draco3d.decoder": await draco3d.default.createDecoderModule(),
      });

    const document = await io.read(inputPath);
    await document.transform(draco({ method: "edgebreaker" }));
    await io.write(outputPath, document);

    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(outputPath).size;
    const savings = Math.round((1 - compressedSize / originalSize) * 100);
    console.log(`[3d-model] Compressed: ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(compressedSize / 1024 / 1024).toFixed(1)}MB (${savings}% smaller)`);
  } catch (err) {
    console.error("[3d-model] Draco compression failed, using uncompressed GLB:", err);
    if (inputPath !== outputPath) {
      fs.copyFileSync(inputPath, outputPath);
    }
  }
}

export async function generate3DModel(localImagePath: string, mountType: string | null): Promise<{ glbUrl: string; glbPreviewUrl: string | null }> {
  const noBgPath = await removeBackground(localImagePath);

  const { glbPath, previewPath } = await generateGlb(noBgPath);

  const compressedFilename = `model-compressed-${Date.now()}-${Math.random().toString(36).slice(2)}.glb`;
  const compressedPath = path.join(trophyUploadDir, compressedFilename);
  await compressGlb(glbPath, compressedPath);

  if (fs.existsSync(noBgPath)) fs.unlinkSync(noBgPath);
  if (glbPath !== compressedPath && fs.existsSync(glbPath)) fs.unlinkSync(glbPath);

  const glbUrl = `/uploads/trophies/${compressedFilename}`;
  const glbPreviewUrl = previewPath ? `/uploads/trophies/${path.basename(previewPath)}` : null;

  console.log(`[3d-model] Pipeline complete: GLB=${glbUrl}, Preview=${glbPreviewUrl}, Mount=${mountType}`);
  return { glbUrl, glbPreviewUrl };
}
