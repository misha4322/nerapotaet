import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import YandexProvider from "next-auth/providers/yandex";
import CredentialsProvider from "next-auth/providers/credentials";
import Steam from "next-auth-steam";
import bcrypt from "bcrypt";
import type { NextRequest } from "next/server";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

// ✅ Экспорт для getServerSession (чтобы твой /profile мог импортировать)
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/login",
    signOut: "/",
    error: "/auth/error",
    newUser: "/auth/register",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          image: user.avatarUrl ?? undefined,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID!,
      clientSecret: process.env.YANDEX_CLIENT_SECRET!,
    }),

    // ⚠️ Steam добавим ниже условно (в handler), чтобы не 500 если нет ключа
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account?.provider) return false;

      if (account.provider === "credentials") return true;

      // Google/Yandex должны иметь email
      if (account.provider !== "steam" && !user.email) return false;

      const provider = account.provider;
      const providerId = account.providerAccountId;

      const existing = await db.query.users.findFirst({
        where: user.email
          ? eq(users.email, user.email)
          : and(eq(users.provider, provider), eq(users.providerId, providerId)),
      });

      if (!existing) {
        const rawName =
          user.name ??
          (profile as any)?.personaname ??
          `user_${provider}_${providerId.slice(0, 8)}`;

        // У тебя username UNIQUE — делаем уникальный
        let username = rawName.trim().slice(0, 32) || "user";
        let i = 0;
        while (true) {
          const u = await db.query.users.findFirst({
            where: eq(users.username, username),
          });
          if (!u) break;
          i += 1;
          const suffix = `_${i}`;
          username = (rawName.trim().slice(0, 32 - suffix.length) || "user") + suffix;
        }

        await db.insert(users).values({
          email: user.email ?? null, // Steam => null (важно: email должен быть nullable в БД)
          username,
          provider,
          providerId,
          avatarUrl: user.image ?? (profile as any)?.avatarfull ?? null,
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.email = user.email ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.email = (token.email as string | null) ?? null;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

// ✅ handlers: добавляем Steam только если есть ключ
function buildOptions(req: NextRequest): NextAuthOptions {
  const opts: NextAuthOptions = { ...authOptions };

  const steamKey = process.env.STEAM_SECRET;
  if (steamKey && steamKey.trim().length > 0) {
    opts.providers = [
      ...(opts.providers ?? []),
      Steam(req, { clientSecret: steamKey }),
    ];
  }

  return opts;
}

async function handler(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
  return NextAuth(req, ctx, buildOptions(req));
}

export { handler as GET, handler as POST };
