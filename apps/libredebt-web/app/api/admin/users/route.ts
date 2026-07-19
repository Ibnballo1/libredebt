import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { asc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    // 1. Double check authentication safeguards match your announcement endpoint
    const session = await auth.api.getSession({ headers: req.headers });
    const ADMIN_EMAILS = [
      "ibnballo@gmail.com",
      "belloabdullateef035@gmail.com",
      "aburaslaan81@gmail.com",
      "webtekhy@gmail.com",
    ];

    if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json(
        { error: "Unauthorized access. Admins only." },
        { status: 403 },
      );
    }

    // 2. Fetch the minimal data required for your select inputs
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .orderBy(asc(users.email)); // Alphabetical sorting makes selection easy

    return NextResponse.json(userList);
  } catch (error) {
    console.error("[FETCH_ADMIN_USERS_ERR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
