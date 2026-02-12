import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

function safeExt(filename: string) {
  const ext = path.extname(filename || "").toLowerCase();
  const allowed = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
  return allowed.has(ext) ? ext : ".png";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    // Поддержка одного файла (ключ "file") и множества (ключ "files[]")
    const files: File[] = [];

    const singleFile = form.get("file");
    if (singleFile instanceof File) files.push(singleFile);

    const multipleFiles = form.getAll("files[]");
    multipleFiles.forEach((item) => {
      if (item instanceof File) files.push(item);
    });

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const maxBytes = 5 * 1024 * 1024; // 5MB
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
      }
      if (file.size > maxBytes) {
        return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      const ext = safeExt(file.name);
      const name = `${crypto.randomUUID()}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const fullPath = path.join(uploadDir, name);
      await writeFile(fullPath, bytes);
      uploadedUrls.push(`/uploads/${name}`);
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (e) {
    console.error("POST /api/upload error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}