import Link from "next/link";

import { lucia, validateRequest } from "@/lib/auth";
import { Form } from "@/lib/form";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { ActionResult } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { TimeSpan } from "lucia";
import { HMAC } from "oslo/crypto";
import { createJWT } from "oslo/jwt";
import { FaGithub } from "react-icons/fa";
import { formSchema } from "../_helpers/formValidations";

export default async function Page() {
  const { user } = await validateRequest();
  if (user) {
    return redirect("/");
  }
  return (
    <div className="">
      <div className="text-center flex items-center justify-center gap-x-2 mb-3">
        <h1 className="font-medium uppercase">Sign In</h1>
      </div>
      <Form action={login}>
        <div className="mb-3">
          <Label htmlFor="username">Username</Label>
          <Input name="username" id="username" />
        </div>
        <div className="mb-3">
          <Label htmlFor="password">Password</Label>
          <Input type="password" name="password" id="password" />
        </div>
        <Button className="w-full">Continue</Button>
      </Form>
      <div className="text-center mt-4 flex items-center justify-center gap-x-2">
        <Separator orientation="horizontal" />
        <Link href="/sign-up" className="text-xs">
          <Button variant={"secondary"} size={"sm"}>
            Create an account
          </Button>
        </Link>
        <Separator orientation="horizontal" />
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        <a href="/api/github/login">
          <Button size={"lg"} variant={"outline"}>
            <FaGithub />
          </Button>
        </a>
      </div>
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
