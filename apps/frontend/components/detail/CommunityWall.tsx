'use client';

import { useState } from 'react';
import { MessageCircle, Send, ThumbsUp } from 'lucide-react';

interface Reply {
  id: number;
  user: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
}

interface Comment {
  id: number;
  user: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  replies: Reply[];
}

interface CommunityWallProps {
  comments: Comment[];
}

export default function CommunityWall({ comments }: CommunityWallProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-brand font-bold text-slate-900 flex items-center gap-2">
        <MessageCircle className="text-[#FF6B3D]" size={24} />
        Community Wall
      </h2>

      <div className="glass-panel rounded-3xl p-5 shadow-lg shadow-orange-500/5">
        {/* Input Area */}
        <div className="mb-6">
          <div className="relative">
            <textarea 
              className="w-full bg-slate-50 rounded-2xl p-4 pr-12 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20 focus:bg-white transition-all resize-none h-24 font-medium"
              placeholder="Say something to the community..."
            />
            <button className="absolute bottom-3 right-3 p-2 bg-[#FF6B3D] text-white rounded-xl shadow-md hover:bg-[#E55A2D] transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="group">
              {/* Main Comment */}
              <div className="flex gap-3">
                <img src={comment.avatar} alt={comment.user} className="w-9 h-9 rounded-full border border-slate-100 shadow-sm shrink-0" />
                <div className="flex-1">
                  <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-brand font-bold text-sm text-slate-900">{comment.user}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{comment.time}</span>
                    </div>
                    <p className="text-slate-600 text-sm leading-snug">{comment.content}</p>
                  </div>
                  
                  {/* Main Comment Actions */}
                  <div className="flex items-center gap-4 mt-1.5 ml-2">
                    <button className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-[#FF6B3D] transition-colors">
                      <ThumbsUp size={12} /> {comment.likes}
                    </button>
                    <button className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                      Reply
                    </button>
                  </div>

                  {/* Nested Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-3 pl-3 border-l-2 border-slate-100 space-y-3">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="flex gap-2">
                          <img src={reply.avatar} alt={reply.user} className="w-6 h-6 rounded-full shrink-0" />
                          <div>
                            <div className="bg-slate-50 rounded-xl rounded-tl-none p-2.5">
                              <span className="font-brand font-bold text-xs text-slate-900 block mb-0.5">{reply.user}</span>
                              <p className="text-slate-500 text-xs">{reply.content}</p>
                            </div>
                            {/* Nested Reply Actions */}
                            <div className="flex items-center gap-3 mt-1 ml-1">
                              <button className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-[#FF6B3D] transition-colors">
                                <ThumbsUp size={10} /> {reply.likes}
                              </button>
                              <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 py-2 text-xs font-bold text-slate-400 hover:text-[#FF6B3D] uppercase tracking-wide transition-colors">
          Load more comments
        </button>
      </div>
    </div>
  );
}

