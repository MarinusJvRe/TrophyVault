import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { objectStorageClient } from "./replit_integrations/object_storage";

function parsePrivateObjectDir(): { bucketName: string; prefix: string } {
  const dir = process.env.PRIVATE_OBJECT_DIR || "";
  if (!dir) {
    throw new Error("PRIVATE_OBJECT_DIR not set");
  }
  const normalized = dir.startsWith("/") ? dir.slice(1) : dir;
  const parts = normalized.split("/");
  const bucketName = parts[0];
  const prefix = parts.slice(1).join("/");
  return { bucketName, prefix };
}

export async function uploadBufferToStorage(
  buffer: Buffer,
  originalFilename: string,
  contentType: string
): Promise<string> {
  const { bucketName, prefix } = parsePrivateObjectDir();
  const ext = path.extname(originalFilename) || "";
  const objectId = `${randomUUID()}${ext}`;
  const objectName = `${prefix}/uploads/${objectId}`;

  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);

  await file.save(buffer, {
    contentType,
    resumable: false,
  });

  return `/objects/uploads/${objectId}`;
}

export async function uploadFileToStorage(
  filePath: string,
  contentType?: string
): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    contentType ||
    (ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".glb"
            ? "model/gltf-binary"
            : ext === ".gif"
              ? "image/gif"
              : "application/octet-stream");
  return uploadBufferToStorage(buffer, path.basename(filePath), mime);
}
