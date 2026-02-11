"use client";

import { useEffect, useState, useCallback } from "react";
import CommentItem from "./CommentItem";

export default function Comments({ postId }: { postId: string }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  async function sendComment() {
    if (!text.trim()) return;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: text }),
    });
    if (res.ok) {
      setText("");
      loadComments();
    }
  }

  if (loading) return <div>Загрузка комментариев...</div>;

  return (
    <div className="comments-section">
      <div className="comment-form">
        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Напишите комментарий..."
        />
        <button onClick={sendComment}>Отправить</button>
      </div>
      <div className="comments-list">
        {comments.map(c => (
          <CommentItem key={c.id} comment={c} postId={postId} onUpdate={loadComments} />
        ))}
      </div>
    </div>
  );
}