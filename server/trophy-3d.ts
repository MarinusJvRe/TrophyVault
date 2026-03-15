import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";
import https from "https";
import type { TrophyAnalysis, CropBox, AnimalDescription } from "./trophy-ai";
import { openai } from "./replit_integrations/image/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

const trophyUploadDir = path.join(process.cwd(), "uploads", "trophies");

const ALLOWED_DOWNLOAD_HOSTS = [
  "fal.media", "v3.fal.media", "storage.googleapis.com",
  "fal-cdn.batuhan.workers.dev", "assets.meshy.ai",
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

export async function smartCropForMount(
  localImagePath: string,
  cropBox: CropBox,
  padding: number = 0.15
): Promise<string> {
  console.log("[3d-model] Smart crop: applying shoulder crop with padding...");
  const sharp = (await import("sharp")).default;
  const metadata = await sharp(localImagePath).metadata();
  const imgW = metadata.width!;
  const imgH = metadata.height!;

  const boxW = cropBox.x_max - cropBox.x_min;
  const boxH = cropBox.y_max - cropBox.y_min;
  const padW = boxW * padding;
  const padH = boxH * padding;
  const x = Math.max(0, cropBox.x_min - padW);
  const y = Math.max(0, cropBox.y_min - padH);
  const w = Math.min(1 - x, boxW + padW * 2);
  const h = Math.min(1 - y, boxH + padH * 2);

  const left = Math.round(x * imgW);
  const top = Math.round(y * imgH);
  const width = Math.round(w * imgW);
  const height = Math.round(h * imgH);

  const croppedFilename = `cropped-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  const croppedPath = path.join(trophyUploadDir, croppedFilename);

  await sharp(localImagePath)
    .extract({ left, top, width, height })
    .png()
    .toFile(croppedPath);

  console.log(`[3d-model] Smart crop complete: ${width}x${height} → ${croppedFilename}`);
  return croppedPath;
}

export async function removeBackground(localImagePath: string): Promise<string> {
  console.log("[3d-model] Removing background...");

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
      model: "General Use (Light)",
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

const THEME_BACKGROUNDS: Record<string, string> = {
  lodge: "mounted on a rich dark oak shield plaque against a warm rustic log cabin wall with warm amber lighting",
  manor: "mounted on an ornate carved mahogany shield plaque against a refined dark wood-paneled study wall with soft warm sconce lighting",
  minimal: "mounted on a clean modern light oak shield plaque against a crisp white gallery wall with subtle directional lighting",
};

export async function generateMountImage(
  bgRemovedImagePath: string,
  animalDescription: AnimalDescription,
  species: string,
  roomTheme: string
): Promise<string> {
  console.log(`[mount-image] Generating mount image for ${species} (theme: ${roomTheme})...`);

  const bgDescription = THEME_BACKGROUNDS[roomTheme] || THEME_BACKGROUNDS.lodge;

  const descParts: string[] = [];
  if (animalDescription.coat_color) descParts.push(`coat/hide: ${animalDescription.coat_color}`);
  if (animalDescription.horn_description) descParts.push(`horns/antlers: ${animalDescription.horn_description}`);
  if (animalDescription.distinctive_features) descParts.push(`distinctive features: ${animalDescription.distinctive_features}`);
  if (animalDescription.face_details) descParts.push(`face: ${animalDescription.face_details}`);
  const animalDetails = descParts.length > 0 ? descParts.join("; ") : species;

  const prompt = `Transform this animal photo into a professional front-facing taxidermy shoulder mount. The animal is a ${species} with these specific features: ${animalDetails}. Repose the animal to face directly forward, showing head, neck, and upper shoulders symmetrically as a classic wall-mount trophy. Preserve the exact coloring, markings, horn/antler shape, and facial features of this specific animal. The mount should be ${bgDescription}. Photorealistic taxidermy quality, dramatic museum lighting, sharp detail.`;

  const imageStream = fs.createReadStream(bgRemovedImagePath);

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: imageStream,
    prompt,
    size: "1024x1024",
  });

  const resultBase64 = (response.data && response.data[0]?.b64_json) ?? "";
  if (!resultBase64) {
    throw new Error("GPT-image-1 returned no image data");
  }

  const mountFilename = `mount-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  const mountPath = path.join(trophyUploadDir, mountFilename);
  fs.writeFileSync(mountPath, Buffer.from(resultBase64, "base64"));

  console.log(`[mount-image] Mount image generated: ${mountFilename}`);
  return mountPath;
}

export async function generateGlb(
  bgRemovedImagePath: string,
  species: string
): Promise<{ glbPath: string; previewPath: string | null; usdzUrl: string | null }> {
  console.log("[3d-model] Generating 3D model via Meshy v6...");

  const imageBuffer = fs.readFileSync(bgRemovedImagePath);
  const blob = new Blob([imageBuffer], { type: "image/png" });
  const file = new File([blob], "trophy-nobg.png", { type: "image/png" });
  const uploadedUrl = await fal.storage.upload(file);

  const texturePrompt = species
    ? `Realistic taxidermy mount of a ${species}, natural fur/hide texture, anatomically accurate`
    : "Realistic taxidermy trophy mount, natural texture";

  const result = await fal.subscribe("fal-ai/meshy/v6/image-to-3d", {
    input: {
      image_url: uploadedUrl,
      enable_pbr: true,
      target_polycount: 30000,
      symmetry_mode: "auto",
      should_remesh: true,
      should_texture: true,
      enable_safety_checker: false,
      texture_prompt: texturePrompt,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        const logs = (update as any).logs;
        if (logs) logs.map((l: any) => l.message).forEach((m: string) => console.log("[3d-model] Meshy:", m));
      }
    },
  });

  const resultData = result.data as any;
  const glbUrl = resultData?.model_glb?.url;
  if (!glbUrl) {
    throw new Error("Meshy returned no GLB model URL");
  }

  const glbFilename = `model-${Date.now()}-${Math.random().toString(36).slice(2)}.glb`;
  const glbPath = path.join(trophyUploadDir, glbFilename);
  await downloadFile(glbUrl, glbPath);
  console.log("[3d-model] GLB downloaded:", glbFilename);

  let previewPath: string | null = null;
  const thumbnailUrl = resultData?.thumbnail?.url;
  if (thumbnailUrl) {
    const previewFilename = `preview-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    previewPath = path.join(trophyUploadDir, previewFilename);
    await downloadFile(thumbnailUrl, previewPath);
    console.log("[3d-model] Thumbnail downloaded:", previewFilename);
  }

  const usdzUrl = resultData?.model_urls?.usdz?.url || null;

  return { glbPath, previewPath, usdzUrl };
}

export async function compressGlb(inputPath: string, outputPath: string): Promise<void> {
  console.log("[3d-model] Compressing GLB with Draco...");
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

export async function generate3DModel(
  localImagePath: string,
  mountType: string | null,
  visionAnalysis?: TrophyAnalysis,
  roomTheme: string = "lodge",
  onMountReady?: (mountRenderUrl: string) => void
): Promise<{ glbUrl: string; glbPreviewUrl: string | null; usdzUrl: string | null; mountRenderUrl: string | null }> {
  let imageForBgRemoval = localImagePath;
  let croppedPath: string | null = null;

  if (visionAnalysis?.shoulder_crop) {
    try {
      croppedPath = await smartCropForMount(localImagePath, visionAnalysis.shoulder_crop);
      imageForBgRemoval = croppedPath;
    } catch (err) {
      console.warn("[3d-model] Smart crop failed, using full image:", err);
    }
  }

  const noBgPath = await removeBackground(imageForBgRemoval);

  let mountImagePath: string | null = null;
  let mountRenderUrl: string | null = null;
  const species = visionAnalysis?.species?.common_name || "";

  if (visionAnalysis?.animal_description) {
    try {
      mountImagePath = await generateMountImage(noBgPath, visionAnalysis.animal_description, species, roomTheme);
      mountRenderUrl = `/uploads/trophies/${path.basename(mountImagePath)}`;
      console.log(`[3d-model] Mount render ready: ${mountRenderUrl}`);
      if (onMountReady) onMountReady(mountRenderUrl);
    } catch (err) {
      console.error("[mount-image] Mount image generation failed, using bg-removed image for 3D:", err);
    }
  }

  const imageFor3D = mountImagePath || noBgPath;
  const { glbPath, previewPath, usdzUrl } = await generateGlb(imageFor3D, species);

  const compressedFilename = `model-compressed-${Date.now()}-${Math.random().toString(36).slice(2)}.glb`;
  const compressedPath = path.join(trophyUploadDir, compressedFilename);
  await compressGlb(glbPath, compressedPath);

  if (croppedPath && fs.existsSync(croppedPath)) fs.unlinkSync(croppedPath);
  if (fs.existsSync(noBgPath)) fs.unlinkSync(noBgPath);
  if (glbPath !== compressedPath && fs.existsSync(glbPath)) fs.unlinkSync(glbPath);

  const glbUrl = `/uploads/trophies/${compressedFilename}`;
  const glbPreviewUrl = previewPath ? `/uploads/trophies/${path.basename(previewPath)}` : null;

  console.log(`[3d-model] Pipeline complete: GLB=${glbUrl}, Preview=${glbPreviewUrl}, USDZ=${usdzUrl ? "yes" : "none"}, Mount=${mountType}, MountRender=${mountRenderUrl ? "yes" : "none"}`);
  return { glbUrl, glbPreviewUrl, usdzUrl, mountRenderUrl };
}

export async function generateMountImageOnly(
  localImagePath: string,
  visionAnalysis: TrophyAnalysis,
  roomTheme: string = "lodge"
): Promise<{ mountRenderUrl: string | null }> {
  let imageForBgRemoval = localImagePath;
  let croppedPath: string | null = null;

  if (visionAnalysis.shoulder_crop) {
    try {
      croppedPath = await smartCropForMount(localImagePath, visionAnalysis.shoulder_crop);
      imageForBgRemoval = croppedPath;
    } catch (err) {
      console.warn("[3d-model] Smart crop failed, using full image:", err);
    }
  }

  const noBgPath = await removeBackground(imageForBgRemoval);

  let mountRenderUrl: string | null = null;
  const species = visionAnalysis.species?.common_name || "";

  if (visionAnalysis.animal_description) {
    try {
      const mountImagePath = await generateMountImage(noBgPath, visionAnalysis.animal_description, species, roomTheme);
      mountRenderUrl = `/uploads/trophies/${path.basename(mountImagePath)}`;
    } catch (err) {
      console.error("[mount-image] Mount image generation failed:", err);
    }
  }

  if (croppedPath && fs.existsSync(croppedPath)) fs.unlinkSync(croppedPath);
  if (fs.existsSync(noBgPath)) fs.unlinkSync(noBgPath);

  return { mountRenderUrl };
}
