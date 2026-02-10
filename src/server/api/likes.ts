import { Elysia, t } from "elysia";
import { db } from "../db";
import { postLikes } from "../db/schema";
import { and, eq } from "drizzle-orm";

export const likesRouter = new Elysia({ prefix: "/likes" })
    .post("/toggle", async ({ body }) => {
        const { postId, userId } = body;
        
        const existing = await db.query.postLikes.findFirst({
            where: and(eq(postLikes.postId, postId), eq(postLikes.userId, userId))
        });

        if (existing) {
            await db.delete(postLikes).where(eq(postLikes.id, existing.id));
            return { liked: false };
        } else {
            await db.insert(postLikes).values({ postId, userId });
            return { liked: true };
        }
    }, {
        body: t.Object({
            postId: t.String(),
            userId: t.String()
        })
    });