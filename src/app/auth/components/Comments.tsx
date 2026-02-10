"use client";

import { useEffect, useState } from "react";
import CommentItem from "./CommentItem";
import "./Comments.css";

type CommentNode = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  author: { id: string; username: string; avatarUrl: string | null };
  likeCount: number;
  dislikeCount: number;
  likedByMe: boolean;
  dislikedByMe: boolean;
  replies: CommentNode[];
};

export default function Comments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadComments() {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
      setError("Не удалось загрузить комментарии");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function addComment(parentId: string | null = null) {
    const content = text.trim();
    if (!content) {
      setError("Комментарий не может быть пустым");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Не удалось отправить комментарий");
      }

      setText("");
      await loadComments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="comments-container">
      <h2 className="comments-title">Комментарии</h2>

      <div className="comments-editor">
        <textarea
          className="comments-textarea"
          placeholder="Написать комментарий..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
        {error && <div className="comments-error">{error}</div>}
        <div className="comments-editor-actions">
          <button
            className="comments-submit-button"
            onClick={() => addComment()}
            disabled={sending || !text.trim()}
          >
            {sending ? "Отправка..." : "Отправить"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="comments-loading">Загрузка комментариев...</div>
      ) : comments.length === 0 ? (
        <div className="comments-empty">Пока нет комментариев</div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onUpdate={loadComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}