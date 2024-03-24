import { validateRequest } from "@/lib/auth";
import { RedirectType, redirect } from "next/navigation";
import { ReactNode } from "react";

const ProtectedLayout = async ({ children }: { children: ReactNode }) => {
  const { user } = await validateRequest();
  console.log("ini current user", user);
  if (!user) {
    return redirect("/sign-in", RedirectType.replace);
  }
  return <div>{children}</div>;
};

export default ProtectedLayout;
