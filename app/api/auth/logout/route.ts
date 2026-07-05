import { NextResponse } from "next/server";

import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });

  // Clear both cookies immediately by setting Max-Age=0
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_ACCESS}=; Max-Age=0; httpOnly; SameSite=Strict; Path=/`,
  );
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_REFRESH}=; Max-Age=0; httpOnly; SameSite=Strict; Path=/api/auth/refresh`,
  );

  return res;
}
