import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { activateProSubscription } from "@/server/services/billing.service";

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
    // 1. Verify the transaction with Paystack
    const transaction = await verifyPaystackTransaction(reference);

    console.log("transaction is:", transaction);

    // 2. Check if the payment status is success
    if (transaction.status === "success") {
      // 3. Extract metadata (userId must be passed during initialization)
      const userId = transaction.metadata?.userId;

      if (userId) {
        // 4. Update the Database
        await activateProSubscription({
          userId: userId,
          provider: "paystack",
          providerSubscriptionId: reference,
          providerCustomerId: transaction.customer?.customer_code || null,
          // Paystack transaction response usually contains the plan or duration
          // Adjust logic here based on your specific plan structure
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year
          plan: "1year",
        });

        return NextResponse.redirect(
          new URL("/settings?tab=billing&status=success", request.url),
        );
      }
    }
  } catch (error) {
    console.error("[Paystack Callback] Verification failed:", error);
  }

  // If anything fails, redirect to billing with an error status
  return NextResponse.redirect(
    new URL("/settings?tab=billing&status=failed", request.url),
  );
}
