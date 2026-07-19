import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, debts, announcements } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, isNull, inArray } from "drizzle-orm";
// Assume you have an email service wrapper like Resend/Nodemailer configured
import { sendAnnouncementEmail } from "@/server/services/email.service";

export async function POST(req: Request) {
  try {
    // 1. Authenticate and verify SuperAdmin privileges
    const session = await auth.api.getSession({ headers: req.headers });

    const ADMIN_EMAILS = [
      "ibnballo@gmail.com",
      "belloabdullateef035@gmail.com",
      "aburaslaan81@gmail.com",
      "webtekhy@gmail.com",
    ]; // Add other admin emails here
    if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json(
        { error: "Unauthorized access. Admins only." },
        { status: 403 },
      );
    }

    // Capture targetEmails as an array from the frontend payload
    const { title, content, targetGroup, targetEmails } = await req.json();

    if (!title || !content || !targetGroup) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let targetUsers: { id: string; email: string; name: string | null }[] = [];

    // 2. Query target audience cohorts
    switch (targetGroup) {
      case "all":
        targetUsers = await db
          .select({ id: users.id, email: users.email, name: users.name })
          .from(users);
        break;

      case "pro":
        targetUsers = await db
          .select({ id: users.id, email: users.email, name: users.name })
          .from(users)
          .where(eq(users.subscriptionTier, "pro"));
        break;

      case "free":
        targetUsers = await db
          .select({ id: users.id, email: users.email, name: users.name })
          .from(users)
          .where(eq(users.subscriptionTier, "free"));
        break;

      case "no-debts":
        // Left join users on debts where debt ID is null (meaning user has registered but entered 0 debts)
        targetUsers = await db
          .select({ id: users.id, email: users.email, name: users.name })
          .from(users)
          .leftJoin(debts, eq(users.id, debts.userId))
          .where(isNull(debts.id));
        break;

      case "individual":
        if (
          !targetEmails ||
          !Array.isArray(targetEmails) ||
          targetEmails.length === 0
        ) {
          return NextResponse.json(
            {
              error:
                "An array of target emails is required for individual messages.",
            },
            { status: 400 },
          );
        }

        // Clean and process input list strings safely
        const sanitizedEmails = targetEmails.map((e: string) =>
          e.trim().toLowerCase(),
        );

        // Single efficient query hitting the target rows using 'inArray'
        targetUsers = await db
          .select({ id: users.id, email: users.email, name: users.name })
          .from(users)
          .where(inArray(users.email, sanitizedEmails));
        break;

      default:
        return NextResponse.json(
          { error: "Invalid target group routing options." },
          { status: 400 },
        );
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: "No active users fit this selection criteria.",
      });
    }

    // 3. Log the broadcast action to history ledger
    await db.insert(announcements).values({
      title,
      content,
      targetGroup,
      // Save array as a scannable text string in your database column
      targetEmail:
        targetGroup === "individual" ? targetEmails.join(", ") : null,
      sentBy: session.user.id,
    });

    // 4. Batch Dispatch Emails concurrently using Promise.allSettled
    const dispatchPromises = targetUsers.map((user) =>
      sendAnnouncementEmail({
        toEmail: user.email,
        userName: user.name || "",
        subject: title,
        messageBody: content,
      }).catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`Failed delivery pipeline for: ${user.email}`, error);
      }),
    );

    await Promise.allSettled(dispatchPromises);

    return NextResponse.json({
      success: true,
      sentCount: targetUsers.length,
      message: `Broadcast processed successfully to ${targetUsers.length} user(s).`,
    });
  } catch (error) {
    console.error("[broadcast_api_error]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
