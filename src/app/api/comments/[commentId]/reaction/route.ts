import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/server/db";
import { commentLikes } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { resolveUserUuid } from "@/lib/user-utils";

export const runtime = "nodejs";

// POST /api/comments/[commentId]/reaction - поставить/убрать лайк/дизлайк
export async function POST(
  req: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
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
    const { type } = body; // "like" или "dislike"

    if (type !== "like" && type !== "dislike") {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    // Проверяем, есть ли уже реакция от этого пользователя на этот комментарий
    const existing = await db.query.commentLikes.findFirst({
      where: and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.userId, userId)
      ),
    });

    if (existing) {
      if (existing.type === type) {
        // Если кликнули на ту же реакцию — удаляем (unlike/undislike)
        await db.delete(commentLikes).where(eq(commentLikes.id, existing.id));
        return NextResponse.json({ action: "removed", type });
      } else {
        // Если кликнули на другую реакцию — обновляем
        await db
          .update(commentLikes)
          .set({ type, createdAt: new Date() })
          .where(eq(commentLikes.id, existing.id));
        return NextResponse.json({ action: "updated", type });
      }
    } else {
      // Создаем новую реакцию
      await db.insert(commentLikes).values({
        commentId,
        userId,
        type,
      });
      return NextResponse.json({ action: "added", type });
    }
  } catch (e) {
    console.error("POST /api/comments/[commentId]/reaction error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}