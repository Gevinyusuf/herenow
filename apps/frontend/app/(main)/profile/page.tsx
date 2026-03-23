'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Calendar, MapPin, Camera, Edit2, Save, X } from 'lucide-react';
import { getUserProfile, updateUserProfile } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/home/Navbar';
import { useEntitlements } from '@/hooks/useEntitlements';
import PermissionModal from '@/components/ui/PermissionModal';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { canAccessCommunity } = useEntitlements();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const handleViewChange = (view: 'events' | 'communities' | 'my-events' | 'my-communities') => {
    if ((view === 'communities' || view === 'my-communities') && !canAccessCommunity) {
      setShowPermissionModal(true);
      return;
    }
    router.push(`/home?view=${view}`);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfile(data);
      setEditData({
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || '',
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      await updateUserProfile(editData);
      
      setProfile(prev => prev ? { ...prev, ...editData } : null);
      setEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url || '',
    });
    setEditing(false);
    setError('');
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentView="profile" onViewChange={handleViewChange} />
      <PermissionModal 
        isOpen={showPermissionModal} 
        onClose={() => setShowPermissionModal(false)} 
      />
      <div className="max-w-4xl mx-auto py-12 px-4 pt-28">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#FF6B3D] to-[#FF855F] h-32" />
          
          <div className="px-8 pb-8">
            <div className="flex items-end -mt-16 mb-6">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-slate-200 flex items-center justify-center">
                    <User className="w-16 h-16 text-slate-400" />
                  </div>
                )}
              </div>
              
              <div className="ml-6 mb-2 flex-1">
                <h1 className="text-3xl font-bold text-slate-900">
                  {profile?.full_name || 'User'}
                </h1>
                <p className="text-slate-500 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile?.email}
                </p>
              </div>
              
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="mb-2 px-4 py-2 bg-[#FF6B3D] text-white rounded-lg hover:bg-[#FF855F] transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>

            {editing && (
              <div className="mb-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit Profile</h3>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editData.full_name}
                      onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6B3D] focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      value={editData.avatar_url}
                      onChange={(e) => setEditData({ ...editData, avatar_url: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6B3D] focus:border-transparent"
                      placeholder="Enter avatar image URL"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-[#FF6B3D] text-white rounded-lg hover:bg-[#FF855F] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-[#FF6B3D]" />
                  <h3 className="font-semibold text-slate-900">Member Since</h3>
                </div>
                <p className="text-slate-600">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-[#FF6B3D]" />
                  <h3 className="font-semibold text-slate-900">Location</h3>
                </div>
                <p className="text-slate-600">Not set</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
