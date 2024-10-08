import { lucia, validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { session, user } = await validateRequest();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: {
      username: user?.username,
    },
    data: {
      token: null, // Use null instead of undefined
    },
  });

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  const baseUrl = req.nextUrl.origin;
  const redirectUrl = `${baseUrl}/sign-in`;

  return NextResponse.redirect(redirectUrl, {
    status: 303,
  });
}
