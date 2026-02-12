import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/server/db";
import { posts, postTags, users } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { slugify } from "@/lib/slug";
import { resolveUserUuid } from "@/lib/user-utils";

export const runtime = "nodejs";

async function makeUniqueSlug(title: string) {
  const base = slugify(title) || "post";
  let slug = base;
  let i = 1;
  while (true) {
    const exists = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
    });
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

export async function GET() {
  try {
    const list = await db.query.posts.findMany({
      where: eq(posts.isPublished, true),
      orderBy: [desc(posts.createdAt)],
      with: {
        author: true,
        category: true,
        postTags: { with: { tag: true } },
      },
    });

    return NextResponse.json({
      posts: list.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        content: p.content,
        coverImage: p.coverImage ?? null, // ✅ добавлено
        createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
        author: {
          id: p.author.id,
          username: p.author.username,
          avatarUrl: p.author.avatarUrl ?? null,
        },
        category: p.category
          ? { id: p.category.id, title: p.category.title }
          : null,
        tags: p.postTags.map((x) => ({ id: x.tag.id, name: x.tag.name })),
      })),
    });
  } catch (e) {
    console.error("GET /api/posts error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await resolveUserUuid(session);
    if (!userId) {
      return NextResponse.json(
        { error: "User not found (bad session id)" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const categoryId = body.categoryId ? String(body.categoryId) : null;
    const tagIds: string[] = Array.isArray(body.tagIds)
      ? body.tagIds.map(String)
      : [];
    const isPublished = body.isPublished === false ? false : true;
    const coverImage = body.coverImage ? String(body.coverImage) : null; // ✅ добавлено

    if (!title || !content) {
      return NextResponse.json(
        { error: "Заполните title и content" },
        { status: 400 }
      );
    }

    const slug = await makeUniqueSlug(title);

    const inserted = await db
      .insert(posts)
      .values({
        title,
        slug,
        content,
        authorId: userId,
        categoryId,
        isPublished,
        coverImage, // ✅ добавлено
      })
      .returning();

    const post = inserted[0];

    if (tagIds.length) {
      await db.insert(postTags).values(
        tagIds.map((tagId) => ({
          postId: post.id,
          tagId,
        }))
      );
    }

    return NextResponse.json({ success: true, post: { id: post.id, slug: post.slug } });
  } catch (e) {
    console.error("POST /api/posts error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}