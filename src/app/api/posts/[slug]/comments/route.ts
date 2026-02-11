import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/server/db";
import { posts, comments, commentLikes } from "@/server/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { resolveUserUuid } from "@/lib/user-utils";

export const runtime = "nodejs";

// Тип узла, который отдаём на фронт
type CommentTreeNode = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string | null;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  dislikeCount: number;
  likedByMe: boolean;
  dislikedByMe: boolean;
  replies: CommentTreeNode[];
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> } // ✅ Next 15 требует await
) {
  try {
    const { slug } = await params; // ✅ обязательно await params

    const session = await getServerSession(authOptions);
    const userUuid = session ? await resolveUserUuid(session) : null;

    // 1) находим пост по slug
    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
      columns: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 2) получаем все комментарии к посту
    const list = await db.query.comments.findMany({
      where: eq(comments.postId, post.id),
      orderBy: [asc(comments.createdAt)],
      with: { author: true },
    });

    if (list.length === 0) {
      return NextResponse.json({ comments: [] as CommentTreeNode[] });
    }

    const ids = list.map((c) => c.id);

    // 3) агрегируем лайки/дизлайки
    const counts = await db
      .select({
        commentId: commentLikes.commentId,
        type: commentLikes.type,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(commentLikes)
      .where(inArray(commentLikes.commentId, ids))
      .groupBy(commentLikes.commentId, commentLikes.type);

    // 4) реакции текущего пользователя (если залогинен)
    const myReactions = userUuid
      ? await db
          .select({
            commentId: commentLikes.commentId,
            type: commentLikes.type,
          })
          .from(commentLikes)
          .where(
            and(
              inArray(commentLikes.commentId, ids),
              eq(commentLikes.userId, userUuid)
            )
          )
      : [];

    // карты для количества
    const likeCountMap = new Map<string, number>();
    const dislikeCountMap = new Map<string, number>();

    for (const row of counts) {
      const n = Number(row.count) || 0;
      if (row.type === "like") likeCountMap.set(row.commentId, n);
      if (row.type === "dislike") dislikeCountMap.set(row.commentId, n);
    }

    // множества реакций пользователя
    const myLikeSet = new Set(
      myReactions.filter((r) => r.type === "like").map((r) => r.commentId)
    );
    const myDislikeSet = new Set(
      myReactions.filter((r) => r.type === "dislike").map((r) => r.commentId)
    );

    // 5) собираем узлы и строим дерево
    const nodeMap = new Map<string, CommentTreeNode>();

    for (const c of list) {
      nodeMap.set(c.id, {
        id: c.id,
        postId: c.postId,
        parentId: c.parentId,
        content: c.content,
        createdAt: c.createdAt ? c.createdAt.toISOString() : null,
        author: {
          id: c.author.id,
          username: c.author.username,
          avatarUrl: c.author.avatarUrl ?? null,
        },
        likeCount: likeCountMap.get(c.id) ?? 0,
        dislikeCount: dislikeCountMap.get(c.id) ?? 0,
        likedByMe: myLikeSet.has(c.id),
        dislikedByMe: myDislikeSet.has(c.id),
        replies: [],
      });
    }

    const roots: CommentTreeNode[] = [];

    for (const node of nodeMap.values()) {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    }

    return NextResponse.json({ comments: roots });
  } catch (e) {
    console.error("GET /api/posts/[slug]/comments error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> } // ✅ Next 15 требует await
) {
  try {
    const { slug } = await params; // ✅ обязательно await params

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

    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
      columns: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await req.json();
    const content = String(body.content ?? "").trim();
    const parentId = body.parentId ? String(body.parentId) : null;

    if (!content) {
      return NextResponse.json({ error: "Пустой комментарий" }, { status: 400 });
    }

    // проверка parentId (если это ответ)
    if (parentId) {
      const parent = await db.query.comments.findFirst({
        where: eq(comments.id, parentId),
        columns: { id: true, postId: true },
      });

      if (!parent || parent.postId !== post.id) {
        return NextResponse.json(
          { error: "Некорректный parentId" },
          { status: 400 }
        );
      }
    }

    const inserted = await db
      .insert(comments)
      .values({
        postId: post.id,
        authorId: userId,
        content,
        parentId,
      })
      .returning();

    return NextResponse.json({ success: true, comment: inserted[0] });
  } catch (e) {
    console.error("POST /api/posts/[slug]/comments error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
