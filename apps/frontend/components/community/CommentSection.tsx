'use client';

import { useState } from 'react';
import { Heart, Send } from 'lucide-react';
import { Comment } from '@/lib/api/community';
import { createPostComment } from '@/lib/api/community';

interface CommentSectionProps {
  communityId: string;
  postId: string;
  comments: Comment[];
  isLocked?: boolean;
  onCommentAdded?: (comment: Comment) => void;
}

export default function CommentSection({
  communityId,
  postId,
  comments,
  isLocked = false,
  onCommentAdded,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await createPostComment(communityId, postId, newComment);
      setNewComment('');
      onCommentAdded?.(comment);
    } catch (error) {
      console.error('评论失败:', error);
      alert('评论失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="border-t border-slate-100">
      <div className="p-4 space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <img
                src={comment.author_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name)}&background=FF6B3D&color=fff`}
                alt={comment.author_name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-900">
                    {comment.author_name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{comment.content}</p>
                <div className="flex items-center gap-4 mt-2">
                  <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
                    <Heart size={12} />
                    <span>{comment.likes_count || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">暂无评论</p>
        )}
      </div>

      {!isLocked ? (
        <div className="p-4 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="写下你的评论..."
              className="flex-1 px-4 py-2 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !newComment.trim()}
              className="px-4 py-2 bg-[#FF6B3D] text-white rounded-xl hover:bg-[#E55A2D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-400">该帖子已锁定，无法评论</p>
        </div>
      )}
    </div>
  );
}
