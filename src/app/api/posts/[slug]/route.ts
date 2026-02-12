import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/server/db";
import { posts, postLikes } from "@/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { resolveUserUuid } from "@/lib/user-utils";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    const userId = session ? await resolveUserUuid(session) : null;

    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
      with: {
        author: true,
        category: true,
        postTags: { with: { tag: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Подсчёт лайков/дизлайков
    const likes = await db
      .select({
        type: postLikes.type,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(postLikes)
      .where(eq(postLikes.postId, post.id))
      .groupBy(postLikes.type);

    let likeCount = 0, dislikeCount = 0;
    for (const row of likes) {
      const n = Number(row.count) || 0;
      if (row.type === "like") likeCount = n;
      if (row.type === "dislike") dislikeCount = n;
    }

    let likedByMe = false, dislikedByMe = false;
    if (userId) {
      const my = await db.query.postLikes.findFirst({
        where: and(eq(postLikes.postId, post.id), eq(postLikes.userId, userId)),
        columns: { type: true },
      });
      likedByMe = my?.type === "like";
      dislikedByMe = my?.type === "dislike";
    }

    return NextResponse.json({
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt?.toISOString() ?? null,
        coverImage: post.coverImage ?? null,
        author: {
          id: post.author.id,
          username: post.author.username,
          avatarUrl: post.author.avatarUrl ?? null,
        },
        category: post.category
          ? { id: post.category.id, title: post.category.title }
          : null,
        tags: post.postTags.map((x) => ({ id: x.tag.id, name: x.tag.name })),
        likeCount,
        dislikeCount,
        likedByMe,
        dislikedByMe,
      },
    });
  } catch (e) {
    console.error("GET /api/posts/[slug] error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}