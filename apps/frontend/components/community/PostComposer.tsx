'use client';

import { useState } from 'react';
import { ImagePlus, Send, X } from 'lucide-react';
import { createCommunityPost } from '@/lib/api/community';

interface PostComposerProps {
  communityId: string;
  onPostCreated?: (post: any) => void;
}

export default function PostComposer({ communityId, onPostCreated }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || content.length < 10) {
      alert('帖子内容至少需要10个字符');
      return;
    }

    setIsSubmitting(true);
    try {
      const post = await createCommunityPost(communityId, content, images);
      setContent('');
      setImages([]);
      setIsExpanded(false);
      onPostCreated?.(post);
    } catch (error) {
      console.error('发布帖子失败:', error);
      alert('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageAdd = () => {
    const url = prompt('请输入图片URL');
    if (url && url.trim()) {
      setImages([...images, url.trim()]);
    }
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="分享你的想法..."
            className="w-full resize-none border-0 focus:ring-0 text-slate-700 placeholder-slate-400 text-sm"
            rows={isExpanded ? 4 : 2}
          />

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`预览 ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleImageRemove(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleImageAdd}
              className="p-2 text-slate-400 hover:text-[#FF6B3D] hover:bg-orange-50 rounded-full transition-colors"
            >
              <ImagePlus size={20} />
            </button>
            <span className="text-xs text-slate-400">
              {content.length}/1000
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsExpanded(false);
                setContent('');
                setImages([]);
              }}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || content.length < 10}
              className="px-4 py-2 bg-[#FF6B3D] text-white text-sm font-semibold rounded-xl hover:bg-[#E55A2D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={16} />
              {isSubmitting ? '发布中...' : '发布'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
