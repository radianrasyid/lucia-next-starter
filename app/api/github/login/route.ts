import { github } from "@/lib/githubProvider";
import { generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET() {
  const state = generateState();
  console.log("ini state github", {
    state,
    client_id: process.env.GITHUB_CLIENT_ID,
    secret: process.env.GITHUB_CLIENT_SECRET,
  });
  const url = await github.createAuthorizationURL(state);
  console.log("ini url github", url);
  cookies().set("github_oauth_state", state, {
    path: "/",
    secure: true,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return Response.redirect(url);
}
