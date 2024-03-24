import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
  const { user } = await validateRequest();

  const testing = await prisma.user.update({
    data: {
      token: null,
    },
    where: {
      username: user?.username,
    },
  });

  return NextResponse.json(testing, {
    status: 200,
  });
}
