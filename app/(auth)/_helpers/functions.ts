import { lucia, validateRequest } from "@/lib/auth";
import { ActionResult } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { RedirectType, redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { z } from "zod";
import { formSchema } from "./formValidations";
import { generateId } from "lucia";
import { cookies } from "next/headers";

export async function ChangeUserPassword(
  _: any,
  formData: FormData,
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

    return redirect("/lucia-starter", RedirectType.replace);
  } else if (!validate.success) {
    return {
      error: validate?.error?.message || "Password do not match",
    };
  }

  return {
    error: "Something went wrong",
  };
}

export async function signup(
  _: any,
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const username = formData.get("username");
  const password = formData.get("password");

  const validate = formSchema.safeParse({ username, password });

  if (validate.success) {
    const { username, password } = validate.data;
    const isAlreadyThere = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!!isAlreadyThere?.username) {
      return {
        error: "This username is already taken",
      };
    }

    const hashedPassword = await new Argon2id().hash(password);
    const userId = generateId(15);

    try {
      await prisma.user.create({
        data: {
          username: username,
          password: hashedPassword,
          id: userId,
        },
      });

      const session = await lucia.createSession(userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    } catch (e) {
      return {
        error: "An unknown error occurred",
      };
    }
    return redirect("/");
  }

  return {
    error: "something went wrong",
  };
}
