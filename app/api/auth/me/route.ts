import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(session.sub).select("name email role").lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
