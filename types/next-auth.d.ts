import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;              // uuid пользователя из БД
      username?: string | null;
      avatarUrl?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;                // uuid пользователя из БД
    username?: string | null;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;              // uuid пользователя из БД (мы его кладём в jwt)
    username?: string | null;
    avatarUrl?: string | null;

    // стандартные поля можно оставить
    email?: string | null;
    name?: string | null;
    picture?: string | null;
  }
}

export {};
