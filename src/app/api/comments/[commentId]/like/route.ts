import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/server/db";
import { comments, commentLikes, users } from "@/server/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { postId: string } }) {
  const { postId } = params;
  const session = await getServerSession(authOptions);
  
  let userUuid: string | null = null;
  if (session?.user?.id) {
    const dbUser = await db.query.users.findFirst({ where: eq(users.providerId, session.user.id) });
    userUuid = dbUser?.id ?? null;
  }

  // Загружаем все комментарии к посту
  const list = await db.query.comments.findMany({
    where: eq(comments.postId, postId),
    orderBy: [asc(comments.createdAt)],
    with: { author: true },
  });

  if (list.length === 0) return NextResponse.json({ comments: [] });

  const ids = list.map((c) => c.id);

  // Считаем лайки
  const likeCounts = await db
    .select({
      commentId: commentLikes.commentId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(commentLikes)
    .where(inArray(commentLikes.commentId, ids))
    .groupBy(commentLikes.commentId);

  // Проверяем, лайкал ли текущий юзер
  const myLikes = userUuid 
    ? await db.select({ commentId: commentLikes.commentId }).from(commentLikes)
        .where(and(inArray(commentLikes.commentId, ids), eq(commentLikes.userId, userUuid)))
    : [];

  const countMap = new Map(likeCounts.map(r => [r.commentId, Number(r.count)]));
  const myLikeSet = new Set(myLikes.map(r => r.commentId));

  // Собираем дерево
  const map = new Map();
  list.forEach(c => {
    map.set(c.id, {
      ...c,
      createdAt: c.createdAt.toISOString(),
      author: { id: c.author.id, username: c.author.username, avatarUrl: c.author.avatarUrl },
      likeCount: countMap.get(c.id) || 0,
      likedByMe: myLikeSet.has(c.id),
      replies: []
    });
  });

  const roots: any[] = [];
  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return NextResponse.json({ comments: roots });
}

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.query.users.findFirst({ where: eq(users.providerId, session.user.id) });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const inserted = await db.insert(comments).values({
    postId: params.postId,
    authorId: dbUser.id,
    content: body.content,
    parentId: body.parentId || null,
  }).returning();

  return NextResponse.json({ success: true, comment: inserted[0] });
}