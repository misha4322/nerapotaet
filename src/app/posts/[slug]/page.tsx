import Link from "next/link";
import { headers } from "next/headers";
import Comments from "@/app/auth/components/Comments"; 
type Post = {
  id: string;
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string; avatarUrl: string | null };
  category: { id: string; title: string } | null;
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

async function getPost(slug: string): Promise<Post> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/posts/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load post");
  }

  const data = await res.json();
  return data.post as Post;
}

export default async function PostPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = await getPost(slug);

  return (
    <div className="post-page">
      <div className="container">
        <div className="post-navigation">
          <Link href="/posts" className="post-nav-link">
            ← К постам
          </Link>
          <Link href="/" className="post-nav-link">
            Главная
          </Link>
        </div>

        <h1 className="post-title">{post.title}</h1>

        <div className="post-meta">
          Автор: {post.author.username}
          {post.category ? ` • Игра: ${post.category.title}` : ""}
        </div>

        {post.tags?.length ? (
          <div className="post-tags">
            {post.tags.map((t) => (
              <span key={t.id} className="post-tag">
                #{t.name}
              </span>
            ))}
          </div>
        ) : null}

        <div className="post-content">{post.content}</div>

        
        <Comments postSlug={slug} />
      </div>
    </div>
  );
}