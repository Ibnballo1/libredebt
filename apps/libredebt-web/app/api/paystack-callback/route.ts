import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { activateProSubscription } from "@/server/services/billing.service";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * Robust extraction utility to ensure the build stays completely type-safe
 */
function extractUserId(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const meta = metadata as Record<string, unknown>;

  const userId = meta.userId;
  if (typeof userId === "string" && userId) return userId;

  const customFields = meta.custom_fields;
  if (Array.isArray(customFields)) {
    const field = customFields.find((f) => {
      if (!f || typeof f !== "object") return false;
      const ff = f as Record<string, unknown>;
      return ff.variable_name === "userId" || ff.display_name === "userId";
    }) as Record<string, unknown> | undefined;

    if (field && field.value != null) return String(field.value);
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference");

  if (!reference) {
    return NextResponse.redirect(
      new URL("/settings?tab=billing&status=error", request.url),
    );
  }

  try {
    const transaction = await verifyPaystackTransaction(reference);

    if (transaction.status === "success") {
      // ◄◄◄ FIXED: Safely extracting the user ID across formats using our helper
      const userId = extractUserId(transaction.metadata);

      if (userId) {
        // Handle plan structural parsing variations cleanly
        const planCode =
          typeof transaction.plan === "string"
            ? transaction.plan
            : (transaction.plan_object?.plan_code ?? "");

        const planType =
          planCode === process.env.PAYSTACK_PLAN_1Y ? "1year" : "6month";

        await activateProSubscription({
          userId,
          provider: "paystack",
          providerSubscriptionId: reference,
          providerCustomerId: transaction.customer?.customer_code || null,
          currentPeriodEnd: new Date(
            Date.now() +
              (planType === "1year" ? 365 : 180) * 24 * 60 * 60 * 1000,
          ),
          plan: planType,
        });

        revalidatePath("/settings");

        return NextResponse.redirect(
          new URL("/settings?tab=billing&status=success", request.url),
          303,
        );
      }
    }
  } catch (error) {
    console.error("[Paystack Callback] Verification failed:", error);
  }

  return NextResponse.redirect(
    new URL("/settings?tab=billing&status=failed", request.url),
    303,
  );
}
