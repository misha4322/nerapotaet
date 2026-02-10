import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { posts } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params; // ✅ Next 16: params Promise

  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
      author: true,
      category: true,
      postTags: { with: { tag: true } },
    },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    post: {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt.toISOString(),
      author: { id: post.author.id, username: post.author.username, avatarUrl: post.author.avatarUrl ?? null },
      category: post.category ? { id: post.category.id, title: post.category.title } : null,
      tags: post.postTags.map((x) => ({ id: x.tag.id, name: x.tag.name })),
    },
  });
}
