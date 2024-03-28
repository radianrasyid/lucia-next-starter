import { lucia } from "@/lib/auth";
import { googleAuth } from "@/lib/googleProvider";
import { prisma } from "@/lib/prisma";
import { OAuth2RequestError } from "arctic";
import { TimeSpan, generateId } from "lucia";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { HMAC } from "oslo/crypto";
import { createJWT } from "oslo/jwt";
import { Argon2id } from "oslo/password";

export async function GET(req: NextRequest) {
  const url = new URL(req.nextUrl);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies().get("google_oauth_state")?.value ?? null;
  const storedCodeVerifier =
    cookies().get("google_code_verifier")?.value ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const token = await googleAuth.validateAuthorizationCode(
      code,
      storedCodeVerifier as string
    );
    const googleUserResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      }
    );
    const googleUser = await googleUserResponse.json();
    // Replace this with your own db client
    const existingUser = await prisma.user.findUnique({
      where: {
        email: googleUser.email,
      },
    });

    if (existingUser) {
      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = await lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
      const secret = await new HMAC("SHA-256").generateKey();
      const payload = {
        username: existingUser.username,
        id: existingUser.id,
      };
      const jwt = await createJWT("HS256", secret, payload, {
        expiresIn: new TimeSpan(8, "h"),
      });
      await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          token: jwt,
          google_id: googleUser.sub,
        },
      });
      const origin = req.nextUrl.origin;
      return NextResponse.redirect(origin, {
        status: 303,
      });
    }

    const userId = generateId(15);
    const hashedPassword = await new Argon2id().hash("12345678");
    const createUser = await prisma.user.create({
      data: {
        id: userId,
        google_id: googleUser.sub,
        username: googleUser.email,
        password: hashedPassword,
        email: googleUser.email,
      },
    });
    cookies().set("code", "911", {
      httpOnly: true,
    });
    const secret = await new HMAC("SHA-256").generateKey();
    const payload = {
      username: createUser.username,
      id: createUser.id,
    };
    const jwt = await createJWT("HS256", secret, payload, {
      expiresIn: new TimeSpan(8, "h"),
    });
    await prisma.user.update({
      where: {
        id: createUser.id,
      },
      data: {
        token: jwt,
      },
    });
    const session = await lucia.createSession(userId, {});
    const sessionCookie = await lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
    const origin = req.nextUrl.origin;
    return NextResponse.redirect(origin, {
      status: 303,
    });
  } catch (error) {
    if (error instanceof OAuth2RequestError) {
      const origin = req.nextUrl.origin;
      return NextResponse.redirect(`${origin}/sign-in`, {
        status: 303,
      });
    }

    return new Response(null, {
      status: 500,
    });
  }
}

interface GitHubUser {
  id: string;
  login: string;
}
