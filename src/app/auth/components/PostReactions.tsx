"use client";

import { useState } from "react";

export default function PostReactions(props: {
  slug: string;
  likeCount: number;
  dislikeCount: number;
  likedByMe: boolean;
  dislikedByMe: boolean;
}) {
  const [likeCount, setLikeCount] = useState(props.likeCount);
  const [dislikeCount, setDislikeCount] = useState(props.dislikeCount);
  const [likedByMe, setLikedByMe] = useState(props.likedByMe);
  const [dislikedByMe, setDislikedByMe] = useState(props.dislikedByMe);
  const [loading, setLoading] = useState(false);

  async function react(type: "like" | "dislike") {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(props.slug)}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) return;

      setLikeCount(Number(data.likeCount) || 0);
      setDislikeCount(Number(data.dislikeCount) || 0);
      setLikedByMe(!!data.likedByMe);
      setDislikedByMe(!!data.dislikedByMe);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 mt-6">
      <button
        type="button"
        disabled={loading}
        onClick={() => react("like")}
        className={[
          "px-3 py-2 rounded-xl border text-sm",
          likedByMe ? "bg-green-600/20 border-green-500" : "bg-white/5 border-white/10 hover:bg-white/10",
        ].join(" ")}
      >
        👍 {likeCount}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={() => react("dislike")}
        className={[
          "px-3 py-2 rounded-xl border text-sm",
          dislikedByMe ? "bg-red-600/20 border-red-500" : "bg-white/5 border-white/10 hover:bg-white/10",
        ].join(" ")}
      >
        👎 {dislikeCount}
      </button>
    </div>
  );
}