'use client';

import { useState } from 'react';
import { X, Link2, Mail, Copy, Check, Users } from 'lucide-react';
import { createInviteLink, sendEmailInvites } from '@/lib/api/community';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
}

export default function InviteModal({
  isOpen,
  onClose,
  communityId,
  communityName,
}: InviteModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'email'>('link');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [emails, setEmails] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateLink = async () => {
    setIsCreating(true);
    try {
      const result = await createInviteLink(communityId, 7);
      setInviteLink(result.invite_url);
      setExpiresAt(result.expires_at);
    } catch (error) {
      console.error('创建邀请链接失败:', error);
      alert('创建失败，请重试');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleSendEmails = async () => {
    const emailList = emails
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter((e) => e && e.includes('@'));

    if (emailList.length === 0) {
      alert('请输入有效的邮箱地址');
      return;
    }

    setIsSending(true);
    try {
      await sendEmailInvites(communityId, emailList);
      setEmails('');
      alert(`已发送 ${emailList.length} 封邀请邮件`);
    } catch (error) {
      console.error('发送邀请失败:', error);
      alert('发送失败，请重试');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">邀请成员</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'link'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Link2 size={16} className="inline mr-2" />
              邀请链接
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'email'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Mail size={16} className="inline mr-2" />
              邮件邀请
            </button>
          </div>

          {activeTab === 'link' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                创建一个邀请链接，分享给想加入「{communityName}」的朋友
              </p>

              {inviteLink ? (
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-sm text-slate-600 break-all">{inviteLink}</p>
                    {expiresAt && (
                      <p className="text-xs text-slate-400 mt-2">
                        链接将于 {new Date(expiresAt).toLocaleDateString('zh-CN')} 过期
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-3 bg-[#FF6B3D] text-white rounded-xl font-medium hover:bg-[#E55A2D] transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check size={18} />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        复制链接
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCreateLink}
                  disabled={isCreating}
                  className="w-full py-3 bg-[#FF6B3D] text-white rounded-xl font-medium hover:bg-[#E55A2D] transition-colors disabled:opacity-50"
                >
                  {isCreating ? '创建中...' : '创建邀请链接'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                输入邮箱地址，发送邀请邮件（每行一个或用逗号分隔）
              </p>

              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="friend@example.com&#10;another@example.com"
                className="w-full h-32 px-4 py-3 bg-slate-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20"
              />

              <button
                onClick={handleSendEmails}
                disabled={isSending || !emails.trim()}
                className="w-full py-3 bg-[#FF6B3D] text-white rounded-xl font-medium hover:bg-[#E55A2D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                {isSending ? '发送中...' : '发送邀请'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
