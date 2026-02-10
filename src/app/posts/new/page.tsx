import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { db } from "@/server/db";
import { categories, tags } from "@/server/db/schema";
import { asc } from "drizzle-orm";

import PostEditor from "@/app/auth/posts/PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const games = await db.select().from(categories).orderBy(asc(categories.title));
  const themes = await db.select().from(tags).orderBy(asc(tags.name));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Создать пост</h1>
        <PostEditor categories={games} tags={themes} />
      </div>
    </div>
  );
}
