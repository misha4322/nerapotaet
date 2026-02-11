import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { db } from "@/server/db";
import { posts, postLikes, users } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function resolveUserUuid(session: any): Promise<string | null> {
  const rawId = session?.user?.id ? String(session.user.id) : null;
  if (!rawId) return null;

  if (isUuid(rawId)) return rawId;

  const byProviderId = await db.query.users.findFirst({
    where: eq(users.providerId, rawId),
  });
  if (byProviderId) return byProviderId.id;

  const email = session?.user?.email ? String(session.user.email).toLowerCase() : null;
  if (email) {
    const byEmail = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (byEmail) return byEmail.id;
  }

  return null;
}

export async function POST(_: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;

    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await resolveUserUuid(session);
    if (!userId) return NextResponse.json({ error: "User not found (bad session id)" }, { status: 401 });

    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
    });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const existing = await db.query.postLikes.findFirst({
      where: and(eq(postLikes.postId, post.id), eq(postLikes.userId, userId)),
    });

    if (existing) {
      await db.delete(postLikes).where(eq(postLikes.id, existing.id));
      return NextResponse.json({ liked: false });
    } else {
      await db.insert(postLikes).values({ postId: post.id, userId });
      return NextResponse.json({ liked: true });
    }
  } catch (e) {
    console.error("POST /api/posts/[slug]/like error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
