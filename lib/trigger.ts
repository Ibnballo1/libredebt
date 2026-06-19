/**
 * lib/trigger.ts — Trigger.dev v3 Configuration Configuration Engine
 *
 * Trigger.dev v3 manages background jobs outside of serverless execution bounds.
 * Tasks are self-contained processes declared with the task() primitive.
 */

// In Trigger.dev v3, you don't create an instance client.
// You simply use global utilities or export tasks directly.
export { tasks } from "@trigger.dev/sdk/v3";
