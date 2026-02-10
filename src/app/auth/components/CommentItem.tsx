"use client";

import { useState } from "react";
import "./CommentItem.css";

type Comment = {
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
  replies: Comment[];
};

export default function CommentItem({
  comment,
  postId,
  onUpdate,
  depth = 0,
}: {
  comment: Comment;
  postId: string;
  onUpdate: () => Promise<void>;
  depth?: number;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [liking, setLiking] = useState(false);
  const [disliking, setDisliking] = useState(false);

  const [localLiked, setLocalLiked] = useState(comment.likedByMe);
  const [localDisliked, setLocalDisliked] = useState(comment.dislikedByMe);
  const [localLikeCount, setLocalLikeCount] = useState(comment.likeCount);
  const [localDislikeCount, setLocalDislikeCount] = useState(comment.dislikeCount);

  async function handleLike() {
    if (liking) return;
    setLiking(true);

    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to like");

      const data = await res.json();
      
      if (data.action === "added") {
        setLocalLiked(true);
        setLocalLikeCount(prev => prev + 1);
        if (localDisliked) {
          setLocalDisliked(false);
          setLocalDislikeCount(prev => Math.max(0, prev - 1));
        }
      } else {
        setLocalLiked(false);
        setLocalLikeCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setLiking(false);
    }
  }

  async function handleDislike() {
    if (disliking) return;
    setDisliking(true);

    try {
      const res = await fetch(`/api/comments/${comment.id}/dislike`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to dislike");

      const data = await res.json();
      
      if (data.action === "added") {
        setLocalDisliked(true);
        setLocalDislikeCount(prev => prev + 1);
        if (localLiked) {
          setLocalLiked(false);
          setLocalLikeCount(prev => Math.max(0, prev - 1));
        }
      } else {
        setLocalDisliked(false);
        setLocalDislikeCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Dislike error:", err);
    } finally {
      setDisliking(false);
    }
  }

  async function handleReply() {
    const content = replyText.trim();
    if (!content || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId: comment.id }),
      });

      if (!res.ok) throw new Error("Failed to reply");

      setReplyText("");
      setIsReplying(false);
      await onUpdate();
    } catch (err) {
      console.error("Reply error:", err);
    } finally {
      setSendingReply(false);
    }
  }

  const maxDepth = 4;
  const isTooDeep = depth >= maxDepth;

  return (
    <div
      className="comment-item"
      style={{
        marginLeft: depth > 0 ? `${Math.min(depth, maxDepth) * 20}px` : "0",
      }}
    >
      <div className="comment-header">
        <div className="comment-author">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.username}
              className="comment-avatar"
            />
          ) : (
            <div className="comment-avatar-placeholder">
              {comment.author.username[0].toUpperCase()}
            </div>
          )}
          <div className="comment-author-info">
            <span className="comment-username">{comment.author.username}</span>
            <span className="comment-date">
              {new Date(comment.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="comment-actions">
          <button
            className={`comment-action-button ${localLiked ? "liked" : ""}`}
            onClick={handleLike}
            disabled={liking}
            title="Лайк"
          >
            <span className="comment-action-icon">👍</span>
            <span className="comment-action-count">{localLikeCount}</span>
          </button>

          <button
            className={`comment-action-button ${localDisliked ? "disliked" : ""}`}
            onClick={handleDislike}
            disabled={disliking}
            title="Дизлайк"
          >
            <span className="comment-action-icon">👎</span>
            <span className="comment-action-count">{localDislikeCount}</span>
          </button>

          {!isTooDeep && (
            <button
              className="comment-reply-button"
              onClick={() => setIsReplying(!isReplying)}
            >
              Ответить
            </button>
          )}
        </div>
      </div>

      <div className="comment-content">{comment.content}</div>

      {isReplying && !isTooDeep && (
        <div className="comment-reply-form">
          <textarea
            className="comment-reply-textarea"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Написать ответ..."
            rows={3}
          />
          <div className="comment-reply-actions">
            <button
              className="comment-reply-submit"
              onClick={handleReply}
              disabled={sendingReply || !replyText.trim()}
            >
              {sendingReply ? "Отправка..." : "Отправить"}
            </button>
            <button
              className="comment-reply-cancel"
              onClick={() => setIsReplying(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onUpdate={onUpdate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}