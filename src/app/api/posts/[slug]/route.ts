import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { posts, postTags, tags } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Получаем пост
    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
      with: {
        author: true,
        category: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 2. Получаем теги для этого поста
    const postTagsRelations = await db
      .select({ tag: tags })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id));

    const tagsList = postTagsRelations.map((rel) => rel.tag);

    return NextResponse.json({
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
      createdAt: post.createdAt ? post.createdAt.toISOString() : null,
        author: {
          id: post.author.id,
          username: post.author.username,
          avatarUrl: post.author.avatarUrl ?? null,
        },
        category: post.category
          ? { id: post.category.id, title: post.category.title }
          : null,
        tags: tagsList.map((t) => ({ id: t.id, name: t.name })),
      },
    });
  } catch (e) {
    console.error("GET /api/posts/[slug] error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}