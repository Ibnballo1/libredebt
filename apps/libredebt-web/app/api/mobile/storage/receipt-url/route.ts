/**
 * app/api/mobile/storage/receipt-url/route.ts
 * POST — generate a presigned R2 URL for direct receipt upload from mobile
 *
 * Body: { filename: string, contentType: string }
 *
 * Returns: { presignedUrl, publicUrl }
 *
 * The mobile app then PUTs the file directly to presignedUrl from the
 * device (browser → R2, never through our server), then includes
 * publicUrl as receiptUrl when calling /api/mobile/debts/[id]/payment.
 *
 * This is identical to the web app's getReceiptUploadUrlAction but
 * as a Route Handler instead of a Server Action so the mobile client
 * can call it via fetch.
 *
 * presignedUrl expires after 60 seconds — the mobile app must PUT
 * the file immediately after receiving it.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireMobileUser, isUnauthorized } from "@/lib/mobile-auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

// Validate env vars at module load time so misconfiguration fails fast
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_id;
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

if (
  !R2_ENDPOINT ||
  !R2_ACCESS_KEY ||
  !R2_SECRET_KEY ||
  !R2_BUCKET ||
  !R2_PUBLIC_DOMAIN
) {
  const missing = [
    !R2_ENDPOINT && "CLOUDFLARE_R2_ENDPOINT",
    !R2_ACCESS_KEY && "CLOUDFLARE_R2_ACCESS_KEY_id",
    !R2_SECRET_KEY && "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    !R2_BUCKET && "CLOUDFLARE_R2_BUCKET_NAME",
    !R2_PUBLIC_DOMAIN && "CLOUDFLARE_R2_PUBLIC_DOMAIN",
  ].filter(Boolean);
  throw new Error(
    `[mobile/storage/receipt-url] Missing env vars: ${missing.join(", ")}`,
  );
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

export async function POST(request: NextRequest) {
  const auth = await requireMobileUser(request);
  if (isUnauthorized(auth)) return auth;

  try {
    const { filename, contentType } = await request.json();

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 },
      );
    }

    if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          error: `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Scoped path: receipts/{userId}/{uuid}.{ext}
    // userId prefix means we can delete all receipts for a user on
    // account deletion (just list the prefix and bulk-delete).
    const uniqueId = crypto.randomUUID();
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const objectKey = `receipts/${auth.user.id}/${uniqueId}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60, // 60 seconds — tight window for security
    });

    // Strip trailing slash from domain before joining with key
    // R2_PUBLIC_DOMAIN is validated above; assert non-null for TypeScript
    const domain = R2_PUBLIC_DOMAIN!.replace(/\/$/, "");
    const publicUrl = `${domain}/${objectKey}`;

    return NextResponse.json({ presignedUrl, publicUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[mobile/storage/receipt-url] error:", message);
    return NextResponse.json(
      { error: "Could not generate upload URL" },
      { status: 500 },
    );
  }
}
