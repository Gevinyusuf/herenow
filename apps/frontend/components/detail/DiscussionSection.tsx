'use client';

import { useState, useEffect } from 'react';
import { Send, Heart, CornerDownRight } from 'lucide-react';
import { getEventComments, createEventComment, toggleCommentLike } from '@/lib/api/client';

interface Comment {
  id: string;
  user: string;
  avatar: string;
  time: string;
  content: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface DiscussionSectionProps {
  eventId: string;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

export default function DiscussionSection({
  eventId,
  isLoggedIn,
  onAuthRequired,
}: DiscussionSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  }>({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
    has_more: false
  });
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  // 加载评论
  useEffect(() => {
    const loadComments = async () => {
      try {
        setIsLoading(true);
        const result = await getEventComments(eventId);
        // 修复：从返回对象中提取 comments 和 pagination
        setComments(result.comments || []);
        setPagination(result.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 0,
          has_more: false
        });
      } catch (error) {
        console.error('加载评论失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      loadComments();
    }
  }, [eventId]);

  // 提交新评论
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    if (!isLoggedIn) {
      onAuthRequired();
      return;
    }

    try {
      const newCommentData = await createEventComment(eventId, newComment);
      setComments([newCommentData, ...comments]);
      setNewComment('');
    } catch (error: any) {
      alert(error.message || '发布评论失败，请稍后重试');
    }
  };

  // 提交回复
  const handleSubmitReply = async (parentId: string) => {
    const content = replyContent[parentId]?.trim();
    if (!content) return;

    if (!isLoggedIn) {
      onAuthRequired();
      return;
    }

    try {
      const newReply = await createEventComment(eventId, content, parentId);
      
      // 更新评论列表，将回复添加到对应父评论
      setComments(comments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          };
        }
        return comment;
      }));
      
      setReplyContent({ ...replyContent, [parentId]: '' });
      setReplyingTo(null);
    } catch (error: any) {
      alert(error.message || '发布回复失败，请稍后重试');
    }
  };

  // 点赞/取消点赞
  const handleLike = async (commentId: string) => {
    if (!isLoggedIn) {
      onAuthRequired();
      return;
    }

    try {
      const result = await toggleCommentLike(commentId);
      
      // 更新评论列表
      const updateCommentLikes = (commentList: Comment[]): Comment[] => {
        return commentList.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: result.likes_count,
              isLiked: result.liked
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateCommentLikes(comment.replies)
            };
          }
          return comment;
        });
      };
      
      setComments(updateCommentLikes(comments));
    } catch (error: any) {
      alert(error.message || '操作失败，请稍后重试');
    }
  };

  if (isLoading) {
    return (
      <div className="border-t border-slate-100 pt-8 mt-4">
        <div className="text-center text-slate-400 py-8">加载中...</div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 pt-8 mt-4">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-slate-900 font-brand font-bold text-lg">Discussion</h3>
        {/* 显示总评论数，使用黄色背景徽章 */}
        {pagination.total > 0 ? (
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
            {pagination.total}
          </span>
        ) : null}
      </div>

      {/* 输入框 */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-start gap-2 focus-within:ring-1 focus-within:ring-[#FF6B3D] focus-within:border-[#FF6B3D] transition-all mb-6">
        <div className="flex-1">
          <textarea 
            placeholder="Ask a question..." 
            rows={1}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
            className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:ring-0 text-sm py-1 px-1 resize-none min-h-[36px]"
          />
        </div>
        <button 
          onClick={handleSubmitComment}
          disabled={!newComment.trim()}
          className="bg-white hover:bg-[#FF6B3D] hover:text-white text-slate-400 shadow-sm border border-slate-200 p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </div>

      {/* 评论列表 */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center text-slate-400 py-8 text-sm">No comments yet. Be the first to share your thoughts!</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <img src={comment.avatar} alt={comment.user} className="w-8 h-8 rounded-full bg-slate-100 border border-white shadow-sm shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-slate-900 font-bold text-xs">{comment.user}</h4>
                  <span className="text-[10px] text-slate-400">{comment.time}</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">{comment.content}</p>
                
                {/* 操作按钮 */}
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={() => handleLike(comment.id)}
                    className={`text-[10px] font-bold flex items-center gap-1 transition-all duration-200 ${comment.isLiked ? 'text-[#FF6B3D]' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Heart size={12} fill={comment.isLiked ? "currentColor" : "none"} className={`transition-transform duration-200 ${comment.isLiked ? 'scale-110' : ''}`} /> 
                    {comment.likes}
                  </button>
                  <button 
                    onClick={() => {
                      if (isLoggedIn) {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        if (!replyContent[comment.id]) {
                          setReplyContent({ ...replyContent, [comment.id]: '' });
                        }
                      } else {
                        onAuthRequired();
                      }
                    }}
                    className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${replyingTo === comment.id ? 'text-[#FF6B3D]' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Reply
                  </button>
                </div>

                {/* 回复列表 */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 space-y-4 pl-4 border-l-2 border-slate-100">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <img src={reply.avatar} alt={reply.user} className="w-6 h-6 rounded-full bg-slate-100 border border-white shadow-sm shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-slate-900 font-bold text-[10px]">{reply.user}</h4>
                            <span className="text-[10px] text-slate-400">{reply.time}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">{reply.content}</p>
                          <button 
                            onClick={() => handleLike(reply.id)}
                            className={`text-[10px] font-bold flex items-center gap-1 mt-1 transition-all duration-200 ${reply.isLiked ? 'text-[#FF6B3D]' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            <Heart size={10} fill={reply.isLiked ? "currentColor" : "none"} /> 
                            {reply.likes}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 回复输入框 */}
                {replyingTo === comment.id && (
                  <div className="mt-3 flex items-start gap-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <CornerDownRight size={12} className="text-slate-400" />
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 p-1.5 flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder={`Reply to ${comment.user}...`}
                        value={replyContent[comment.id] || ''}
                        onChange={(e) => setReplyContent({ ...replyContent, [comment.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmitReply(comment.id);
                          }
                        }}
                        className="flex-1 bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-400 focus:ring-0 p-0"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={!replyContent[comment.id]?.trim()}
                        className="text-[#FF6B3D] text-[10px] font-bold px-2 py-0.5 hover:bg-orange-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

