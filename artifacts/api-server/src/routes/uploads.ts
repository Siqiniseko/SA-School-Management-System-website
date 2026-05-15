import express, { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const router: IRouter = Router();

const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "uploads");
const allowedFolders = new Set(["profiles", "records"]);
const maxUploadBytes = 8 * 1024 * 1024;

const contentTypeExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "text/csv": ".csv",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

function sanitizeFileName(fileName: string) {
  return path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function parseDataUrl(data: string) {
  const match = data.match(/^data:([^;,]+);base64,(.+)$/);
  if (match) {
    return {
      contentType: match[1],
      base64: match[2],
    };
  }

  return {
    contentType: null,
    base64: data,
  };
}

router.post("/uploads", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const folder = typeof body.folder === "string" ? body.folder : "";
  const fileName = typeof body.fileName === "string" ? sanitizeFileName(body.fileName) : "";
  const rawData = typeof body.data === "string" ? body.data : "";

  if (!allowedFolders.has(folder)) {
    res.status(400).json({ error: "Invalid upload folder" });
    return;
  }

  if (!fileName || !rawData) {
    res.status(400).json({ error: "fileName and data are required" });
    return;
  }

  const parsed = parseDataUrl(rawData);
  const contentType =
    parsed.contentType ?? (typeof body.contentType === "string" ? body.contentType : "application/octet-stream");

  if (folder === "profiles" && !contentType.startsWith("image/")) {
    res.status(400).json({ error: "Profile uploads must be image files" });
    return;
  }

  let fileBytes: Buffer;
  try {
    fileBytes = Buffer.from(parsed.base64, "base64");
  } catch {
    res.status(400).json({ error: "Invalid file data" });
    return;
  }

  if (fileBytes.byteLength === 0) {
    res.status(400).json({ error: "Uploaded file is empty" });
    return;
  }

  if (fileBytes.byteLength > maxUploadBytes) {
    res.status(400).json({ error: "Uploaded file must be 8MB or smaller" });
    return;
  }

  const originalExtension = path.extname(fileName).toLowerCase();
  const extension = originalExtension || contentTypeExtensions[contentType] || ".bin";
  const storedName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const folderPath = path.join(uploadRoot, folder);
  const storedPath = path.join(folderPath, storedName);

  await mkdir(folderPath, { recursive: true });
  await writeFile(storedPath, fileBytes);

  res.status(201).json({
    url: `/api/uploads/${folder}/${storedName}`,
    fileName,
    contentType,
    size: fileBytes.byteLength,
  });
});

router.use("/uploads", express.static(uploadRoot));

export default router;
