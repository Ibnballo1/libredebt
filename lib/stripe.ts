// /**
//  * lib/stripe.ts — Stripe Client
//  *
//  * Stripe handles USD/international subscriptions.
//  * Server-side only.
//  *
//  * SETUP:
//  *   npm install stripe
//  *   1. Stripe Dashboard → Products → Create Product
//  *      Name: "LibreDebt Pro", Price: $5/month recurring
//  *   2. Copy the Price ID (e.g. "price_xxxxxxxx") into STRIPE_PRO_PRICE_ID
//  *   3. Stripe Dashboard → Developers → Webhooks → Add endpoint
//  *      URL: https://yourdomain.com/api/webhooks/stripe
//  *      Events: checkout.session.completed, customer.subscription.updated,
//  *              customer.subscription.deleted, invoice.payment_failed
//  */

// import Stripe from "stripe";

// if (!process.env.STRIPE_SECRET_KEY) {
//   throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
// }

// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: "2026-05-27.dahlia",
//   typescript: true,
// });

// export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";
// export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

// // ─── Create a Checkout Session ────────────────────────────────────────────────

// export async function createStripeCheckoutSession(params: {
//   email: string;
//   userId: string;
//   successUrl: string;
//   cancelUrl: string;
// }): Promise<{ url: string | null }> {
//   const session = await stripe.checkout.sessions.create({
//     mode: "subscription",
//     payment_method_types: ["card"],
//     customer_email: params.email,
//     line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
//     success_url: params.successUrl,
//     cancel_url: params.cancelUrl,
//     client_reference_id: params.userId,
//     metadata: { userId: params.userId },
//   });

//   return { url: session.url };
// }

// // ─── Cancel a subscription ───────────────────────────────────────────────────

// /**
//  * Cancels at the end of the current billing period — the user keeps
//  * Pro access until they've paid for, consistent with the Paystack flow.
//  */
// export async function cancelStripeSubscription(
//   subscriptionId: string,
// ): Promise<void> {
//   await stripe.subscriptions.update(subscriptionId, {
//     cancel_at_period_end: true,
//   });
// }

// // ─── Webhook signature verification ──────────────────────────────────────────

// export function constructStripeEvent(
//   rawBody: string,
//   signature: string,
// ): Stripe.Event {
//   return stripe.webhooks.constructEvent(
//     rawBody,
//     signature,
//     STRIPE_WEBHOOK_SECRET,
//   );
// }
