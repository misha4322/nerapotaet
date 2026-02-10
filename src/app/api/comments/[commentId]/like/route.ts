import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { db } from "@/server/db";
import { commentLikes } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(_: Request, ctx: { params: { commentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const commentId = ctx.params.commentId;

  const existing = await db.query.commentLikes.findFirst({
    where: and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, session.user.id)),
  });

  if (existing) {
    await db.delete(commentLikes).where(eq(commentLikes.id, existing.id));
    return NextResponse.json({ liked: false });
  } else {
    await db.insert(commentLikes).values({ commentId, userId: session.user.id });
    return NextResponse.json({ liked: true });
  }
}
