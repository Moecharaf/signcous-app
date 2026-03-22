import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_UPLOAD_MB = Number(process.env.MAX_ARTWORK_UPLOAD_MB ?? "100");
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "ai",
  "eps",
  "png",
  "jpg",
  "jpeg",
  "tif",
  "tiff",
  "psd",
]);

function getSafeExtension(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) return null;
  return ext;
}

function getPublicBaseUrl(request: NextRequest): string {
  const configuredBaseUrl =
    process.env.PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = request.headers.get("host")?.split(",")[0]?.trim();

  const proto = forwardedProto || "https";
  const resolvedHost = forwardedHost || host;

  if (!resolvedHost) {
    return new URL(request.url).origin;
  }

  return `${proto}://${resolvedHost}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${MAX_UPLOAD_MB}MB.` },
        { status: 413 }
      );
    }

    const ext = getSafeExtension(file.name);
    if (!ext) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, AI, EPS, PNG, JPG, TIFF, or PSD." },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });

    const storedName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const targetPath = path.join(uploadDir, storedName);

    await writeFile(targetPath, fileBuffer);

    const baseUrl = getPublicBaseUrl(request);
    const fileUrl = `${baseUrl}/uploads/${storedName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      originalName: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Artwork upload failed:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
