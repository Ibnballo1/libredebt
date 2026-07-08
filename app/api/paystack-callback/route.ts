import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { activateProSubscription } from "@/server/services/billing.service";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

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
      const userId = transaction.metadata?.userId;

      if (userId) {
        // DYNAMIC PLAN SELECTION: Use transaction data to determine duration
        const planType =
          transaction.plan === process.env.PAYSTACK_PLAN_1Y
            ? "1year"
            : "6month";

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
