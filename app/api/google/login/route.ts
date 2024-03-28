import { googleAuth } from "@/lib/googleProvider";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  cookies().set("google_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  const url: URL = await googleAuth.createAuthorizationURL(
    state,
    codeVerifier,
    {
      scopes: ["email", "profile"],
    }
  );

  cookies().set("google_oauth_state", state, {
    path: "/",
    secure: true,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  cookies().set("google_code_verifier", codeVerifier, {
    path: "/",
    httpOnly: true,
  });

  return Response.redirect(url);
}
