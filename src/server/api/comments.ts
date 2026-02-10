import { Elysia, t } from "elysia";
import { db } from "../db";
import { comments } from "../db/schema";
import { eq, asc } from "drizzle-orm";

export const commentsRouter = new Elysia({ prefix: "/comments" })
    .get("/post/:postId", async ({ params }) => {
        return await db.query.comments.findMany({
            where: eq(comments.postId, params.postId),
            orderBy: [asc(comments.createdAt)],
            with: {
                author: true
            }
        });
    })
   
    .post("/", async ({ body }) => {
        return await db.insert(comments).values(body).returning();
    }, {
        body: t.Object({
            postId: t.String(),
            authorId: t.String(),
            content: t.String(),
            parentId: t.Optional(t.String()) 
        })
    })
    .delete("/:id", async ({ params }) => {
        await db.delete(comments).where(eq(comments.id, params.id));
        return { success: true };
    });