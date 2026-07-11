"use server";

import { createSafeActionClient } from "next-safe-action";
import { requireUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { crypto } from "crypto";
import { z } from "zod";

const authAction = createSafeActionClient().use(async ({ next }) => {
  const user = await requireUser();
  if (!user) redirect("/login");
  return next({ ctx: { userId: user.id } });
});

// Initialize Cloudflare R2 Client (R2 uses standard S3 SDK)
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!, // e.g., https://<accountid>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_id!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
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

    // Sanitize file names to isolate user assets safely
    const uniqueId = globalThis.crypto.randomUUID();
    const cleanExtension = filename.split(".").pop() || "png";
    const objectKey = `receipts/${userId}/${uniqueId}.${cleanExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: objectKey,
        ContentType: contentType,
      });

      // Valid URL token expires in 60 seconds for security
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60,
      });
      const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${objectKey}`;

      return { success: true as const, presignedUrl, publicUrl };
    } catch (error) {
      return {
        success: false as const,
        error: "Could not generate security upload parameters.",
      };
    }
  });
