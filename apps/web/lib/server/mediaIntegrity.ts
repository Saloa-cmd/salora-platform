import { createHash } from "node:crypto";

const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

export type ExpectedMedia = {
  storageBucket: string;
  storagePath: string;
  publicUrl: string;
  mimeType: "image/webp" | "image/avif";
  width: number;
  height: number;
  fileSize: number;
  checksum: string;
};

export function verifyProductMediaBytes(bytes: Buffer, input: Pick<ExpectedMedia, "mimeType" | "width" | "height" | "fileSize" | "checksum">) {
  if (!bytes.length || bytes.length > MAX_MEDIA_BYTES || bytes.length !== input.fileSize) throw new Error("Media file size does not match the certified manifest.");
  if (createHash("sha256").update(bytes).digest("hex") !== input.checksum) throw new Error("Media checksum does not match the certified manifest.");
  if (input.mimeType === "image/webp") {
    const dimensions = webpDimensions(bytes);
    if (!dimensions || dimensions.width !== input.width || dimensions.height !== input.height) throw new Error("Media dimensions do not match the certified manifest.");
  }
  return { bytes: bytes.length };
}

function webpDimensions(bytes: Buffer) {
  if (bytes.length < 30 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") return null;
  const kind = bytes.toString("ascii", 12, 16);
  if (kind === "VP8X") return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
  if (kind === "VP8 " && bytes.length >= 30) return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L" && bytes.length >= 25) {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

export async function verifyProductMedia(input: ExpectedMedia) {
  if (input.storagePath.startsWith("/") || input.storagePath.includes("..") || input.storagePath.includes("\\")) throw new Error("Unsafe media storage path.");
  const configuredOrigin = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredOrigin) throw new Error("Supabase media origin is not configured.");
  const url = new URL(input.publicUrl);
  if (url.protocol !== "https:" || url.origin !== new URL(configuredOrigin).origin) throw new Error("Media URL must use the configured Supabase origin.");
  const expectedPath = `/storage/v1/object/public/${input.storageBucket}/${input.storagePath.split("/").map(encodeURIComponent).join("/")}`;
  if (url.pathname !== expectedPath || url.search || url.hash) throw new Error("Media URL does not match its certified storage path.");

  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(10_000), cache: "no-store" });
  if (!response.ok) throw new Error("Media object could not be fetched.");
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== input.mimeType) throw new Error("Media MIME type does not match the certified manifest.");
  const bytes = Buffer.from(await response.arrayBuffer());
  const verified = verifyProductMediaBytes(bytes, input);
  return { verifiedAt: new Date().toISOString(), contentType, bytes: verified.bytes };
}
