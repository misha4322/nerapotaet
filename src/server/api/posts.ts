import { Elysia, t } from "elysia";
import { db } from "../db";
import { posts } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";

export const postsRouter = new Elysia({ prefix: "/posts" })
    .get("/", async () => {
        return await db.query.posts.findMany({
            where: eq(posts.isPublished, true),
            orderBy: [desc(posts.createdAt)],
            with: {
                author: true,
                category: true,
            }
        });
    })
    .get("/:slug", async ({ params }) => {
        return await db.query.posts.findFirst({
            where: eq(posts.slug, params.slug),
            with: {
                author: true,
                category: true,
                postTags: { with: { tag: true } }
            }
        });
    })
    .post("/", async ({ body }) => {
        return await db.insert(posts).values(body).returning();
    }, {
        body: t.Object({
            title: t.String(),
            slug: t.String(),
            content: t.String(),
            authorId: t.String(),
            categoryId: t.Optional(t.String()),
            coverImage: t.Optional(t.String())
        })
    });