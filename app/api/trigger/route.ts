/**
 * app/api/trigger/route.ts — Trigger.dev HTTP Handler
 *
 * This route receives webhook events from Trigger.dev's infrastructure
 * and dispatches them to the correct job handlers.
 *
 * It MUST be at /api/trigger — that is the path Trigger.dev expects
 * by default. Do not rename or move this file.
 *
 * IMPORTANT: Add this route to the middleware matcher EXCLUSION list
 * so it is not blocked by the auth middleware. The request is
 * authenticated by Trigger.dev's own signing secret, not our sessions.
 *
 * Also import all job files here so they are registered:
 */

// Import all jobs to register them with the client
// import "@/jobs/send-reminder.job"
// import "@/jobs/overdue-check.job"
// import "@/jobs/weekly-summary.job"

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { helloWorldTask } from "@/trigger/example";
import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

//tasks.trigger also works with the edge runtime
//export const runtime = "edge";

export async function GET() {
  const handle = await tasks.trigger<typeof helloWorldTask>(
    "hello-world",
    "James",
  );

  return NextResponse.json(handle);
}

export async function POST() {
  const handle = await tasks.trigger<typeof helloWorldTask>(
    "hello-world",
    "James",
  );

  return NextResponse.json(handle);
}

export async function PUT() {
  const handle = await tasks.trigger<typeof helloWorldTask>(
    "hello-world",
    "James",
  );
  return NextResponse.json(handle);
}

// export const { dynamic } = createNextRouteHandler({
//   client: tasks,
// })
