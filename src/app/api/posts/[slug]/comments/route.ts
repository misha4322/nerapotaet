import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { db } from "@/server/db";
import { posts, comments, commentLikes } from "@/server/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";

export const runtime = "nodejs";

type CommentNode = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  author: { id: string; username: string; avatarUrl: string | null };
  likeCount: number;
  likedByMe: boolean;
  replies: CommentNode[];
};

export async function GET(_: Request, ctx: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const me = session?.user?.id ?? null;

  const post = await db.query.posts.findFirst({ where: eq(posts.slug, ctx.params.slug) });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const list = await db.query.comments.findMany({
    where: eq(comments.postId, post.id),
    orderBy: [asc(comments.createdAt)],
    with: { author: true },
  });

  const ids = list.map((c) => c.id);

  const likeCountRows =
    ids.length === 0
      ? []
      : await db
          .select({
            commentId: commentLikes.commentId,
            count: sql<number>`count(*)`.as("count"),
          })
          .from(commentLikes)
          .where(inArray(commentLikes.commentId, ids))
          .groupBy(commentLikes.commentId);

  const myLikes =
    me && ids.length
      ? await db
          .select({ commentId: commentLikes.commentId })
          .from(commentLikes)
          .where(and(inArray(commentLikes.commentId, ids), eq(commentLikes.userId, me)))
      : [];

  const likeCountMap = new Map(likeCountRows.map((r) => [r.commentId, Number(r.count)]));
  const myLikeSet = new Set(myLikes.map((r) => r.commentId));

  const map = new Map<string, CommentNode>();
  for (const c of list) {
    map.set(c.id, {
      id: c.id,
      postId: c.postId,
      parentId: c.parentId ?? null,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      author: { id: c.author.id, username: c.author.username, avatarUrl: c.author.avatarUrl ?? null },
      likeCount: likeCountMap.get(c.id) ?? 0,
      likedByMe: myLikeSet.has(c.id),
      replies: [],
    });
  }

  const roots: CommentNode[] = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return NextResponse.json({ comments: roots, me });
}

export async function POST(req: Request, ctx: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await db.query.posts.findFirst({ where: eq(posts.slug, ctx.params.slug) });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const body = await req.json();
  const content = String(body.content ?? "").trim();
  const parentId = body.parentId ? String(body.parentId) : null;

  if (!content) return NextResponse.json({ error: "Пустой комментарий" }, { status: 400 });

  if (parentId) {
    const parent = await db.query.comments.findFirst({ where: eq(comments.id, parentId) });
    if (!parent || parent.postId !== post.id) {
      return NextResponse.json({ error: "Некорректный parentId" }, { status: 400 });
    }
  }

  const inserted = await db
    .insert(comments)
    .values({
      postId: post.id,
      authorId: session.user.id,
      content,
      parentId,
    })
    .returning();

  return NextResponse.json({ success: true, comment: inserted[0] });
}
