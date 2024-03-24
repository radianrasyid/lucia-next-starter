import Link from "next/link";

import { lucia, validateRequest } from "@/lib/auth";
import { Form } from "@/lib/form";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { TimeSpan } from "lucia";
import { HMAC } from "oslo/crypto";
import { createJWT } from "oslo/jwt";
import { formSchema } from "../_helpers/formValidations";

export default async function Page() {
  const { user } = await validateRequest();
  if (user) {
    return redirect("/");
  }
  return (
    <div className="text-center">
      <h1>Sign in</h1>
      <Form action={login}>
        <div className="mb-3">
          <Label htmlFor="username">Username</Label>
          <Input name="username" id="username" />
        </div>
        <div className="mb-3">
          <Label htmlFor="password">Password</Label>
          <Input type="password" name="password" id="password" />
        </div>
        <Button>Continue</Button>
      </Form>
      <Link href="/sign-up" className="text-xs">
        Create an account
      </Link>
    </div>
  );
}

async function login(_: any, formData: FormData): Promise<ActionResult> {
  "use server";
  const username = formData.get("username");
  const password = formData.get("password");

  const validate = formSchema.safeParse({ username, password });

  if (validate.success) {
    const { username, password } = validate.data;
    const existingUser = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });
    if (!existingUser) {
      return {
        error: "Incorrect username or password",
      };
    }
    const secret = await new HMAC("SHA-256").generateKey();
    const payload = {
      username: existingUser.username,
      id: existingUser.id,
    };
    const jwt = await createJWT("HS256", secret, payload, {
      expiresIn: new TimeSpan(8, "h"),
    });
    await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        token: jwt,
      },
    });
    const validPassword = await new Argon2id().verify(
      existingUser.password,
      password
    );
    if (!validPassword) {
      return {
        error: "Incorrect username or password",
      };
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
    return redirect("/");
  }

  return {
    error: "username or password doesn't meet requirement",
  };
}
