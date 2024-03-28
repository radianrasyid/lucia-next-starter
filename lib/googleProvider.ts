import { Google } from "arctic";

export const googleAuth = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  "https://localhost:3000/google/callback"
);
