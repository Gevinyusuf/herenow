'use client';

import { useState } from 'react';
import { Crown, Shield, User, MoreHorizontal, UserMinus } from 'lucide-react';
import { Member } from '@/lib/api/community';
import { updateMemberRole, removeMember } from '@/lib/api/community';

interface MemberListProps {
  communityId: string;
  members: Member[];
  currentUserId?: string;
  currentUserRole?: 'owner' | 'admin' | 'member';
  onMemberUpdated?: () => void;
}

export default function MemberList({
  communityId,
  members,
  currentUserId,
  currentUserRole,
  onMemberUpdated,
}: MemberListProps) {
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isOwner = currentUserRole === 'owner';

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={14} className="text-yellow-500" />;
      case 'admin':
        return <Shield size={14} className="text-blue-500" />;
      default:
        return <User size={14} className="text-slate-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 text-xs font-medium rounded-full flex items-center gap-1">
            <Crown size={10} />
            所有者
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full flex items-center gap-1">
            <Shield size={10} />
            管理员
          </span>
        );
      default:
        return null;
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    if (!confirm(`确定要将该成员角色更改为${newRole === 'admin' ? '管理员' : '普通成员'}吗？`)) return;

    setIsUpdating(true);
    try {
      await updateMemberRole(communityId, userId, newRole);
      setShowMenu(null);
      onMemberUpdated?.();
    } catch (error) {
      console.error('更新角色失败:', error);
      alert('更新失败，请重试');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('确定要移除该成员吗？')) return;

    setIsUpdating(true);
    try {
      await removeMember(communityId, userId);
      setShowMenu(null);
      onMemberUpdated?.();
    } catch (error) {
      console.error('移除成员失败:', error);
      alert('移除失败，请重试');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">成员列表</h3>
        <p className="text-sm text-slate-500 mt-1">共 {members.length} 位成员</p>
      </div>

      <div className="divide-y divide-slate-100">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <img
                src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=FF6B3D&color=fff`}
                alt={member.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">
                    {member.nickname || member.full_name}
                  </span>
                  {getRoleBadge(member.role)}
                </div>
                <p className="text-xs text-slate-400">
                  加入于 {formatDate(member.joined_at)}
                </p>
              </div>
            </div>

            {canManage && member.user_id !== currentUserId && member.role !== 'owner' && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(showMenu === member.user_id ? null : member.user_id)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <MoreHorizontal size={18} className="text-slate-400" />
                </button>

                {showMenu === member.user_id && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-2 min-w-[160px] z-10">
                    {isOwner && member.role === 'member' && (
                      <button
                        onClick={() => handleRoleChange(member.user_id, 'admin')}
                        disabled={isUpdating}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Shield size={14} />
                        设为管理员
                      </button>
                    )}
                    {isOwner && member.role === 'admin' && (
                      <button
                        onClick={() => handleRoleChange(member.user_id, 'member')}
                        disabled={isUpdating}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User size={14} />
                        取消管理员
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(member.user_id)}
                      disabled={isUpdating}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-500 flex items-center gap-2"
                    >
                      <UserMinus size={14} />
                      移除成员
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
