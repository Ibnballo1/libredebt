// /**
//  * app/api/webhooks/stripe/route.ts — Stripe Webhook Handler
//  *
//  * Mirrors the Paystack handler's security model exactly:
//  * verify signature → trust payload → upsert subscription → flip tier.
//  *
//  * EVENTS HANDLED:
//  *   checkout.session.completed    → first payment succeeded → activate Pro
//  *   customer.subscription.updated → renewal / period change → keep active,
//  *                                    refresh currentPeriodEnd
//  *   customer.subscription.deleted → subscription fully ended → downgrade
//  *   invoice.payment_failed        → mark past_due
//  */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import type Stripe from "stripe";
// import { constructStripeEvent } from "@/lib/stripe";
// import {
//   activateProSubscription,
//   downgradeToFree,
//   markPastDue,
//   findUserIdBySubscriptionId,
// } from "@/server/services/billing.service";

// export async function POST(request: NextRequest) {
//   const rawBody = await request.text();
//   const signature = request.headers.get("stripe-signature");

//   if (!signature) {
//     return NextResponse.json({ error: "Missing signature" }, { status: 401 });
//   }

//   let event: Stripe.Event;
//   try {
//     event = constructStripeEvent(rawBody, signature);
//   } catch (error) {
//     console.error("[stripe webhook] Signature verification failed:", error);
//     return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//   }

//   try {
//     switch (event.type) {
//       case "checkout.session.completed": {
//         const session = event.data.object as Stripe.Checkout.Session;
//         const userId = session.client_reference_id ?? session.metadata?.userId;

//         if (!userId) {
//           console.error(
//             "[stripe webhook] checkout.session.completed missing userId",
//           );
//           break;
//         }

//         const subscriptionId =
//           typeof session.subscription === "string"
//             ? session.subscription
//             : session.subscription?.id;

//         if (!subscriptionId) {
//           console.error(
//             "[stripe webhook] No subscription ID on completed session",
//           );
//           break;
//         }

//         const periodEnd = new Date();
//         periodEnd.setMonth(periodEnd.getMonth() + 1);

//         await activateProSubscription({
//           userId,
//           provider: "stripe",
//           providerSubscriptionId: subscriptionId,
//           providerCustomerId:
//             typeof session.customer === "string" ? session.customer : null,
//           currentPeriodEnd: periodEnd,
//         });
//         break;
//       }

//       case "customer.subscription.updated": {
//         const subscription = event.data.object as Stripe.Subscription;
//         const userId = await findUserIdBySubscriptionId(subscription.id);

//         if (userId && subscription.status === "active") {
//           const periodEnd = new Date(subscription.ended_at! * 1000);
//           await activateProSubscription({
//             userId,
//             provider: "stripe",
//             providerSubscriptionId: subscription.id,
//             providerCustomerId:
//               typeof subscription.customer === "string"
//                 ? subscription.customer
//                 : null,
//             currentPeriodEnd: periodEnd,
//           });
//         } else if (userId && subscription.status === "past_due") {
//           await markPastDue(userId);
//         }
//         break;
//       }

//       case "customer.subscription.deleted": {
//         const subscription = event.data.object as Stripe.Subscription;
//         const userId = await findUserIdBySubscriptionId(subscription.id);
//         if (userId) await downgradeToFree(userId);
//         break;
//       }

//       // case "invoice.payment_failed": {
//       //   const invoice = event.data.object as Stripe.Invoice;
//       //   const subscriptionId =
//       //     typeof invoice.subscription === "string"
//       //       ? invoice.subscription
//       //       : null;
//       //   if (subscriptionId) {
//       //     const userId = await findUserIdBySubscriptionId(subscriptionId);
//       //     if (userId) await markPastDue(userId);
//       //   }
//       //   break;
//       // }

//       default:
//         console.log(`[stripe webhook] Unhandled event type: ${event.type}`);
//     }

//     return NextResponse.json({ received: true });
//   } catch (error) {
//     console.error("[stripe webhook] Processing error:", error);
//     return NextResponse.json({ received: true, processingError: true });
//   }
// }

// nothing for now
export async function GET() {
  return NextResponse.json({ message: "Stripe webhook endpoint is live" });
}
