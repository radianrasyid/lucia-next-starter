import { lucia, validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
  const { session, user } = await validateRequest();
  const test = await prisma.user.update({
    where: {
      username: user?.username,
    },
    data: {
      token: undefined,
    },
  });
  console.log("ini id", user);
  if (!session) {
    return {
      error: "Unauthorized",
    };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  const baseUrl = req.nextUrl.origin;
  const redirectUrl = `${baseUrl}/sign-in`;
  return NextResponse.redirect(redirectUrl, {
    status: 303,
  });
}
