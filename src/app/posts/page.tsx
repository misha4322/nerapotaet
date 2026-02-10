import Link from "next/link";
import { headers } from "next/headers";

type PostCard = {
  id: string;
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  author: { username: string; avatarUrl?: string | null };
  category: { title: string } | null;
  tags: { id: string; name: string }[];
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");
  return `${proto}://${host}`;
}

async function getPosts(): Promise<PostCard[]> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/posts`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.posts ?? [];
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="posts-page">
      <div className="container">
        <div className="posts-header">
          <h1 className="posts-title">Все посты</h1>
          <div className="posts-actions">
            <Link href="/" className="posts-action-link">
              Главная
            </Link>
            <Link href="/posts/new" className="posts-action-link primary">
              + Создать
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="posts-empty">
            Пока нет постов. <Link href="/posts/new">Создать первый</Link>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((p) => (
              <Link key={p.id} href={`/posts/${p.slug}`} className="post-card">
                <div className="post-card-title">{p.title}</div>
                <div className="post-card-meta">
                  {p.author.username}
                  {p.category ? ` • ${p.category.title}` : ""}
                </div>
                <div className="post-card-excerpt">
                  {p.content.length > 200 ? p.content.slice(0, 200) + "…" : p.content}
                </div>
                {p.tags?.length ? (
                  <div className="post-card-tags">
                    {p.tags.slice(0, 6).map((t) => (
                      <span key={t.id} className="post-card-tag">
                        #{t.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}