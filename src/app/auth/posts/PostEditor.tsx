"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; title: string };
type Tag = { id: string; name: string };

export default function PostEditor({
  categories,
  tags,
}: {
  categories: Category[];
  tags: Tag[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const canSubmit = useMemo(() => title.trim() && content.trim(), [title, content]);

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    setError("");
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          categoryId: categoryId || null, // игра
          tagIds, // темы
          isPublished: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка создания поста");
        setIsLoading(false);
        return;
      }

      router.push(`/posts/${data.post.slug}`);
      router.refresh();
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/40">{error}</div>
      ) : null}

      <div>
        <label className="text-sm text-gray-300">Заголовок</label>
        <input
          className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Мой обзор на..."
        />
      </div>

      <div>
        <label className="text-sm text-gray-300">Игра (категория)</label>
        <select
          className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">— выбрать —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-300">Темы (теги)</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => {
            const active = tagIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={[
                  "text-xs px-3 py-2 rounded-xl border transition",
                  active ? "bg-violet-600 border-violet-500" : "bg-white/5 border-white/10 hover:bg-white/10",
                ].join(" ")}
              >
                #{t.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-300">Текст</label>
        <textarea
          className="mt-2 w-full min-h-[220px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Пиши пост..."
        />
      </div>

      <button
        disabled={isLoading || !canSubmit}
        onClick={submit}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
      >
        {isLoading ? "Создаю..." : "Опубликовать"}
      </button>
    </div>
  );
}
