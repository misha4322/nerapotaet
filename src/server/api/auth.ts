import { Elysia, t } from "elysia";
import bcrypt from "bcrypt";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const authRouter = new Elysia({ prefix: "/auth" })

  .post("/login", async ({ body, set }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (!user) {
      set.status = 401;
      return { error: "Invalid credentials" };
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      set.status = 401;
      return { error: "Invalid credentials" };
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    }),
  })

  .post("/register", async ({ body, set }) => {
    const exists = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (exists) {
      set.status = 400;
      return { error: "User exists" };
    }

    const hash = await bcrypt.hash(body.password, 10);

    await db.insert(users).values({
      email: body.email,
      username: body.username,
      passwordHash: hash,
    });

    return { success: true };
  }, {
    body: t.Object({
      email: t.String(),
      username: t.String(),
      password: t.String(),
    }),
  });
