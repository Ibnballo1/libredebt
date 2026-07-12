/**
 * server/actions/storage.actions.ts — PATCHED
 *
 * Added startup validation so CLOUDFLARE_R2_PUBLIC_DOMAIN being missing
 * fails loudly with a clear error instead of silently producing
 * "undefined/receipts/..." URLs.
 */

"use server";

import { createSafeActionClient } from "next-safe-action";
import { requireUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

const authAction = createSafeActionClient().use(async ({ next }) => {
  const user = await requireUser();
  if (!user) redirect("/login");
  return next({ ctx: { userId: user.id } });
});

// ── Validate required env vars at module load time ─────────────────────────────
// This throws during server startup if any are missing, giving you an
// immediate clear error instead of "undefined/..." URLs at runtime.

const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_id;
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

const missingVars = [
  !R2_ENDPOINT && "CLOUDFLARE_R2_ENDPOINT",
  !R2_ACCESS_KEY && "CLOUDFLARE_R2_ACCESS_KEY_id",
  !R2_SECRET_KEY && "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  !R2_BUCKET && "CLOUDFLARE_R2_BUCKET_NAME",
  !R2_PUBLIC_DOMAIN && "CLOUDFLARE_R2_PUBLIC_DOMAIN",
].filter(Boolean);

if (missingVars.length > 0) {
  throw new Error(
    `[storage.actions] Missing required environment variables: ${missingVars.join(", ")}\n` +
      `Add them to .env.local and restart the dev server.`,
  );
}

// ── R2 Client ─────────────────────────────────────────────────────────────────

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT!,
  credentials: {
    accessKeyId: R2_ACCESS_KEY!,
    secretAccessKey: R2_SECRET_KEY!,
  },
});

const getPresignedUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

export const getReceiptUploadUrlAction = authAction
  .inputSchema(getPresignedUrlSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { filename, contentType } = parsedInput;

    const uniqueId = globalThis.crypto.randomUUID();
    const cleanExtension = filename.split(".").pop() || "png";
    const objectKey = `receipts/${userId}/${uniqueId}.${cleanExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET!,
        Key: objectKey,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60,
      });

      // R2_PUBLIC_DOMAIN is validated above — guaranteed to be a string here
      // Trim any accidental trailing slash from the domain before joining
      const domain = R2_PUBLIC_DOMAIN!.replace(/\/$/, "");
      const publicUrl = `${domain}/${objectKey}`;

      return { success: true as const, presignedUrl, publicUrl };
    } catch (error) {
      console.error("[storage.actions] Presign error:", error);
      return {
        success: false as const,
        error: "Could not generate security upload parameters.",
      };
    }
  });
