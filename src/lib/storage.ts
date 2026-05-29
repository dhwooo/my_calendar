import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Upload an image buffer and return a public URL.
 *
 * - Production (Vercel): uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set.
 * - Local dev: writes to /public/uploads/.
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    const { put } = await import("@vercel/blob");
    const res = await put(filename, buffer, {
      access: "public",
      contentType,
      token,
      addRandomSuffix: false,
    });
    return res.url;
  }

  // Local filesystem fallback
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

export function newImageFilename(
  userId: string,
  ext: string,
  prefix = "img",
) {
  const safeExt = ext === "jpg" ? "jpeg" : ext;
  return `${prefix}-${userId}-${randomBytes(6).toString("hex")}.${safeExt}`;
}
