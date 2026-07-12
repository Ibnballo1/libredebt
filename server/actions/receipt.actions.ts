/**
 * server/actions/receipt.actions.ts
 *
 * deleteReceiptAction — removes a receipt from R2 and clears the DB field.
 *
 * NOTE: getReceiptUploadUrlAction is already in your codebase (you wrote it).
 * This file only adds the deleteReceiptAction that ReceiptViewer needs.
 *
 * To add this to your existing receipt actions file, just export deleteReceiptAction
 * alongside your existing getReceiptUploadUrlAction.
 */

"use server";

import { createSafeActionClient } from "next-safe-action";
import { requireUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/db";
import { ledgerEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const authAction = createSafeActionClient().use(async ({ next }) => {
  const user = await requireUser();
  if (!user) redirect("/login");
  return next({ ctx: { userId: user.id } });
});

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_id!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const deleteReceiptSchema = z.object({
  ledgerEntryId: z.string().min(1),
  debtId: z.string().optional(),
});

export const deleteReceiptAction = authAction
  .inputSchema(deleteReceiptSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { ledgerEntryId, debtId } = parsedInput;

    // Verify ownership
    const entries = await db
      .select({ id: ledgerEntries.id, receiptUrl: ledgerEntries.receiptUrl })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.id, ledgerEntryId),
          eq(ledgerEntries.userId, userId),
        ),
      )
      .limit(1);

    if (entries.length === 0) {
      return { success: false as const, error: "Payment record not found." };
    }

    const entry = entries[0]!;
    if (!entry.receiptUrl) {
      return {
        success: false as const,
        error: "No receipt attached to this payment.",
      };
    }

    // Extract the object key from the public URL
    // publicUrl format: https://<domain>/receipts/{userId}/{filename}
    // We need just the key: receipts/{userId}/{filename}
    let objectKey: string;
    try {
      const url = new URL(entry.receiptUrl);
      // Remove the leading slash from the pathname
      objectKey = url.pathname.slice(1);
    } catch {
      // If it's already a path, use it directly
      objectKey = entry.receiptUrl;
    }

    try {
      // Delete from R2
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
          Key: objectKey,
        }),
      );
    } catch (err) {
      console.error("[receipt] R2 delete error:", err);
      // Don't block DB cleanup if R2 delete fails
    }

    // Clear from DB
    await db
      .update(ledgerEntries)
      .set({ receiptUrl: null })
      .where(eq(ledgerEntries.id, ledgerEntryId));

    if (debtId) revalidatePath(`/debts/${debtId}`);
    revalidatePath("/payments");

    return { success: true as const };
  });
