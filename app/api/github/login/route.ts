import { github } from "@/lib/githubProvider";
import { generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET() {
  const state = generateState();
  const url = await github.createAuthorizationURL(state, {
    scopes: ["user:email"],
  });
  cookies().set("github_oauth_state", state, {
    path: "/",
    secure: true,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return Response.redirect(url);
}
