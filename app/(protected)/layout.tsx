import { validateRequest } from "@/lib/auth";
import { ActionResult, Form } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { ReactNode } from "react";
import { RxCross2 } from "react-icons/rx";

const ProtectedLayout = async ({ children }: { children: ReactNode }) => {
  const { user } = await validateRequest();
  if (!user) {
    return redirect("/sign-in", RedirectType.replace);
  }
  const currentPassword = await prisma.user.findUnique({
    where: {
      username: user?.username as string,
    },
  });
  const isPasswordDefault = await new Argon2id().verify(
    currentPassword?.password as string,
    "12345678"
  );
  const isClosed = cookies().get("code")?.value ?? null;
  return (
    <div>
      {!!isPasswordDefault && isClosed === "911" && (
        <div className="text-center">
          <div className="p-3 bg-red-100 fixed top-0 w-full flex justify-between items-center">
            <p></p>
            <p className="text-xs">
              you haven't change your password, we recommend you to change the
              password asap
            </p>
            <Form action={closeNotification}>
              <button type="submit" className="w-fit h-fit">
                <RxCross2 type="submit" className="cursor-pointer" />
              </button>
            </Form>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default ProtectedLayout;

async function closeNotification(
  _: any,
  formData: FormData
): Promise<ActionResult> {
  "use server";
  const currentCode = cookies().get("code")?.value;

  if (currentCode === "911") {
    cookies().set("code", "0");
    return {
      error: "",
    };
  }

  return {
    error: "something went wrong",
  };
}
