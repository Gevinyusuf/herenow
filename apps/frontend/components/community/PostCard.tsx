'use client';

import { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Pin, Lock, Edit, Trash2 } from 'lucide-react';
import { Post } from '@/lib/api/community';
import { likePost, unlikePost, deleteCommunityPost, pinPost, unpinPost, lockPost, unlockPost } from '@/lib/api/community';

interface PostCardProps {
  post: Post;
  communityId: string;
  isAdmin?: boolean;
  onPostUpdated?: (post: Post | null) => void;
  onCommentClick?: () => void;
}

export default function PostCard({
  post,
  communityId,
  isAdmin = false,
  onPostUpdated,
  onCommentClick,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = post.is_owner;
  const canManage = isOwner || isAdmin;

  const handleLike = async () => {
    try {
      if (isLiked) {
        await unlikePost(communityId, post.id);
        setLikesCount((prev) => prev - 1);
      } else {
        await likePost(communityId, post.id);
        setLikesCount((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('点赞操作失败:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇帖子吗？')) return;
    
    setIsDeleting(true);
    try {
      await deleteCommunityPost(communityId, post.id);
      onPostUpdated?.(null);
    } catch (error) {
      console.error('删除帖子失败:', error);
      alert('删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePin = async () => {
    try {
      if (post.is_pinned) {
        await unpinPost(communityId, post.id);
        onPostUpdated?.({ ...post, is_pinned: false });
      } else {
        await pinPost(communityId, post.id);
        onPostUpdated?.({ ...post, is_pinned: true });
      }
      setShowMenu(false);
    } catch (error) {
      console.error('置顶操作失败:', error);
    }
  };

  const handleLock = async () => {
    try {
      if (post.is_locked) {
        await unlockPost(communityId, post.id);
        onPostUpdated?.({ ...post, is_locked: false });
      } else {
        await lockPost(communityId, post.id);
        onPostUpdated?.({ ...post, is_locked: true });
      }
      setShowMenu(false);
    } catch (error) {
      console.error('锁定操作失败:', error);
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
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${post.is_pinned ? 'ring-2 ring-[#FF6B3D]/20' : ''}`}>
      {post.is_pinned && (
        <div className="bg-[#FF6B3D]/10 px-4 py-2 flex items-center gap-2 text-sm text-[#FF6B3D] font-medium">
          <Pin size={14} />
          <span>置顶帖子</span>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src={post.author_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name)}&background=FF6B3D&color=fff`}
              alt={post.author_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h4 className="font-semibold text-slate-900">{post.author_name}</h4>
              <p className="text-xs text-slate-400">{formatTime(post.created_at)}</p>
            </div>
          </div>

          {canManage && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <MoreHorizontal size={18} className="text-slate-400" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-2 min-w-[140px] z-10">
                  {isAdmin && (
                    <button
                      onClick={handlePin}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Pin size={14} />
                      {post.is_pinned ? '取消置顶' : '置顶'}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={handleLock}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Lock size={14} />
                      {post.is_locked ? '解锁帖子' : '锁定帖子'}
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-500 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3">
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          
          {post.images && post.images.length > 0 && (
            <div className={`mt-3 grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {post.images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`图片 ${index + 1}`}
                  className="w-full h-48 object-cover rounded-xl"
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
            }`}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={onCommentClick}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#FF6B3D] transition-colors"
          >
            <MessageCircle size={18} />
            <span>{post.comments_count}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
