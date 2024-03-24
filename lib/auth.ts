import { Lucia, TimeSpan } from "lucia";
import { cookies } from "next/headers";
import { cache } from "react";

import type { Session, User } from "lucia";
import { RedirectType, redirect } from "next/navigation";
import { adapter } from "./prisma";

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  sessionExpiresIn: new TimeSpan(8, "h"),
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      token: attributes.token,
    };
  },
});

export const getJwtCookie = cache(
  async (): Promise<{ token: string } | { token: null }> => {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return {
        token: null,
      };
    }

    const result = await lucia.validateSession(sessionId);
    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }

      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
    } catch (e) {}

    if (!!result.user?.token) {
      return {
        token: result.user.token,
      };
    }

    return {
      token: null,
    };
  }
);

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    const result = await lucia.validateSession(sessionId);
    // next.js throws when you attempt to set cookie when rendering page
    try {
      console.log("ini token sekarang", result.user?.token);
      if (!Boolean(result.user?.token)) {
        await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/logout`);
        return {
          user: null,
          session: null,
        };
      }
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
    } catch {}
    return result;
  }
);

export async function logout() {
  "use server";
  const { session } = await validateRequest();
  if (!session) {
    return {
      error: "Unauthorized",
    };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  return redirect("/sign-in", RedirectType.replace);
}

// export async function login(_: any, formData: FormData): Promise<ActionResult> {
//   "use server";
//   const username = formData.get("username");
//   const password = formData.get("password");

//   const validate = formSchema.safeParse({ username, password });

//   if (validate.success) {
//     const { username, password } = validate.data;
//     const existingUser = await prisma.user.findUnique({
//       where: {
//         username: username,
//       },
//     });
//     if (!existingUser) {
//       return {
//         error: "Incorrect username or password",
//       };
//     }
//     const secret = await new HMAC("SHA-256").generateKey();
//     const payload = {
//       username: existingUser.username,
//       id: existingUser.id,
//     };
//     const jwt = await createJWT("HS256", secret, payload, {
//       expiresIn: new TimeSpan(8, "h"),
//     });
//     await prisma.user.update({
//       where: {
//         id: existingUser.id,
//       },
//       data: {
//         token: jwt,
//       },
//     });
//     const validPassword = await new Argon2id().verify(
//       existingUser.password,
//       password
//     );
//     if (!validPassword) {
//       return {
//         error: "Incorrect username or password",
//       };
//     }

//     const session = await lucia.createSession(existingUser.id, {});
//     const sessionCookie = lucia.createSessionCookie(session.id);
//     cookies().set(
//       sessionCookie.name,
//       sessionCookie.value,
//       sessionCookie.attributes
//     );
//     return redirect("/");
//   }

//   return {
//     error: "username or password doesn't meet requirement",
//   };
// }

// export async function signup(
//   _: any,
//   formData: FormData
// ): Promise<ActionResult> {
//   "use server";
//   const username = formData.get("username");
//   const password = formData.get("password");

//   const validate = formSchema.safeParse({ username, password });

//   if (validate.success) {
//     const { username, password } = validate.data;
//     const hashedPassword = await new Argon2id().hash(password);
//     const userId = generateId(15);

//     try {
//       await prisma.user.create({
//         data: {
//           username: username,
//           password: hashedPassword,
//           id: userId,
//         },
//       });

//       const session = await lucia.createSession(userId, {});
//       const sessionCookie = lucia.createSessionCookie(session.id);
//       cookies().set(
//         sessionCookie.name,
//         sessionCookie.value,
//         sessionCookie.attributes
//       );
//     } catch (e) {
//       return {
//         error: "An unknown error occurred",
//       };
//     }
//     return redirect("/");
//   }

//   return {
//     error: "something went wrong",
//   };
// }

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: Omit<DatabaseUser, "id">;
  }

  interface DatabaseUser {
    username: string;
    token: string;
  }
}
