"use server";
import { logout } from "@/lib/auth";
import { RedirectType, redirect } from "next/navigation";

export async function SigningOut() {
  await logout();
  redirect("/sign-in", RedirectType.replace);
}
