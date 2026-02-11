import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { db } from "@/server/db";
import { posts, postTags, users } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function resolveUserUuid(session: any): Promise<string | null> {
  const rawId = session?.user?.id ? String(session.user.id) : null;
  if (!rawId) return null;

  // 1) Если уже UUID — отлично
  if (isUuid(rawId)) return rawId;

  // 2) Иначе пробуем найти по providerId (Steam/Google/Yandex id)
  const byProviderId = await db.query.users.findFirst({
    where: eq(users.providerId, rawId),
  });
  if (byProviderId) return byProviderId.id;

  // 3) Фолбэк: по email (если есть)
  const email = session?.user?.email ? String(session.user.email).toLowerCase() : null;
  if (email) {
    const byEmail = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (byEmail) return byEmail.id;
  }

  return null;
}

async function makeUniqueSlug(title: string) {
  const base = slugify(title) || "post";
  let slug = base;
  let i = 1;

  while (true) {
    const exists = await db.query.posts.findFirst({ where: eq(posts.slug, slug) });
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
        createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
        author: { id: p.author.id, username: p.author.username, avatarUrl: p.author.avatarUrl ?? null },
        category: p.category ? { id: p.category.id, title: p.category.title } : null,
        tags: p.postTags.map((x) => ({ id: x.tag.id, name: x.tag.name })),
      })),
    });
  } catch (e) {
    console.error("GET /api/posts error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await resolveUserUuid(session);
    if (!userId) return NextResponse.json({ error: "User not found (bad session id)" }, { status: 401 });

    const body = await req.json();

    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();

    const categoryId = body.categoryId ? String(body.categoryId) : null;
    const tagIds: string[] = Array.isArray(body.tagIds) ? body.tagIds.map(String) : [];

    const isPublished = body.isPublished === false ? false : true;

    if (!title || !content) {
      return NextResponse.json({ error: "Заполните title и content" }, { status: 400 });
    }

    // categoryId должен быть uuid или null
    const safeCategoryId = categoryId && isUuid(categoryId) ? categoryId : null;

    const slug = await makeUniqueSlug(title);

    const inserted = await db
      .insert(posts)
      .values({
        title,
        slug,
        content,
        authorId: userId,
        categoryId: safeCategoryId,
        isPublished,
      })
      .returning();

    const post = inserted[0];

    if (tagIds.length) {
      const safeTagIds = tagIds.filter(isUuid);
      if (safeTagIds.length) {
        await db.insert(postTags).values(
          safeTagIds.map((tagId) => ({
            postId: post.id,
            tagId,
          }))
        );
      }
    }

    return NextResponse.json({ success: true, post: { id: post.id, slug: post.slug } });
  } catch (e) {
    console.error("POST /api/posts error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
