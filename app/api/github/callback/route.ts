import { lucia } from "@/lib/auth";
import { github } from "@/lib/githubProvider";
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
  const storedState = cookies().get("github_oauth_state")?.value ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const token = await github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });
    const githubUserEmailResponse = await fetch(
      "https://api.github.com/user/emails",
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      }
    );
    const githubUser: GitHubUser = await githubUserResponse.json();
    const githubUserEmail = await githubUserEmailResponse.json();
    // Replace this with your own db client
    const existingUser = await prisma.user.findUnique({
      where: {
        email: githubUserEmail[0].email,
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
          github_id: githubUser.id as any,
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
        github_id: githubUser.id as any,
        username: githubUser.login,
        password: hashedPassword,
        email: githubUserEmail[0].email,
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
