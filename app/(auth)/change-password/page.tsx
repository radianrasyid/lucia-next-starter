import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateRequest } from "@/lib/auth";
import { ActionResult, Form } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { RedirectType, redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { z } from "zod";

const ChangePasswordPage = async () => {
  const { user } = await validateRequest();
  const userPassword = await prisma.user.findUnique({
    where: {
      username: user?.username,
    },
  });
  const isPasswordDefault = await new Argon2id().verify(
    userPassword?.password as string,
    "12345678"
  );
  if (!!user?.username && isPasswordDefault) {
    return (
      <div>
        <Form action={ChangeUserPassword}>
          <div className="flex flex-col mb-3">
            <Label
              htmlFor="new-password-textfield"
              className="mb-1 text-slate-500 text-xs"
            >
              New Password
            </Label>
            <Input
              id="new-password-textfield"
              name="newPassword"
              type="password"
            />
          </div>
          <div className="flex flex-col mb-3">
            <Label
              htmlFor="new-password-confirmation-textfled"
              className="mb-1 text-slate-500 text-xs"
            >
              New Password Confirmation
            </Label>
            <Input
              id="new-password-confirmation-textfield"
              name="newPasswordConfirm"
              type="password"
            />
          </div>
          <Button type="submit" className="w-full">
            Change password!
          </Button>
        </Form>
      </div>
    );
  }

  return redirect("/sign-in", RedirectType.replace);
};

export default ChangePasswordPage;

export async function ChangeUserPassword(
  _: any,
  formData: FormData
): Promise<ActionResult> {
  "use server";
  const { user } = await validateRequest();

  const passwordSchema = z
    .object({
      newPassword: z.string().min(6),
      newPasswordConfirm: z.string().min(6),
    })
    .refine((data) => data.newPasswordConfirm === data.newPassword, {
      message: "Password do not match",
      path: ["newPasswordConfirm"],
    });
  const newPassword = formData.get("newPassword");
  const newPasswordConfirm = formData.get("newPasswordConfirm");
  console.log("ini data masuk", {
    newPassword,
    newPasswordConfirm,
  });

  const validate = passwordSchema.safeParse({
    newPassword,
    newPasswordConfirm,
  });
  if (validate.success && !!user?.username) {
    const { newPassword } = validate.data;
    const hashedPassword = await new Argon2id().hash(newPassword);
    await prisma.user.update({
      where: {
        username: user.username,
      },
      data: {
        password: hashedPassword,
      },
    });

    return redirect("/", RedirectType.replace);
  } else if (!validate.success) {
    return {
      error: validate?.error?.message || "Password do not match",
    };
  }

  return {
    error: "Something went wrong",
  };
}
