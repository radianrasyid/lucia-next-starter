import Link from "next/link";

import { lucia, validateRequest } from "@/lib/auth";
import { Form } from "@/lib/form";
import { generateId } from "lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { formSchema } from "../_helpers/formValidations";

export default async function Page() {
  const { user } = await validateRequest();
  if (user) {
    return redirect("/");
  }
  return (
    <div>
      <h1>Create an account</h1>
      <Form action={signup}>
        <Label htmlFor="username">Username</Label>
        <Input name="username" id="username" />
        <br />
        <Label htmlFor="password">Password</Label>
        <Input type="password" name="password" id="password" />
        <br />
        <Button>Continue</Button>
      </Form>
      <Link href="/sign-in">Sign in</Link>
    </div>
  );
}

export async function signup(
  _: any,
  formData: FormData
): Promise<ActionResult> {
  "use server";
  const username = formData.get("username");
  const password = formData.get("password");

  const validate = formSchema.safeParse({ username, password });

  if (validate.success) {
    const { username, password } = validate.data;
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
        sessionCookie.attributes
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
