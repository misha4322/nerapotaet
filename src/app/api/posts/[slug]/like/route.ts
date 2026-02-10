import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { db } from "@/server/db";
import { posts, postLikes } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(_: Request, ctx: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, ctx.params.slug),
  });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const existing = await db.query.postLikes.findFirst({
    where: and(eq(postLikes.postId, post.id), eq(postLikes.userId, session.user.id)),
  });

  if (existing) {
    await db.delete(postLikes).where(eq(postLikes.id, existing.id));
    return NextResponse.json({ liked: false });
  } else {
    await db.insert(postLikes).values({ postId: post.id, userId: session.user.id });
    return NextResponse.json({ liked: true });
  }
}
