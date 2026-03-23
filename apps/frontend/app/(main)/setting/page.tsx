'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  User, 
  Mail, 
  Lock, 
  Link as LinkIcon, 
  Linkedin, 
  Instagram, 
  Globe, 
  ChevronRight, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Building2 
} from 'lucide-react';
import Navbar from '@/components/home/Navbar';
import BgBlobs from '@/components/home/BgBlobs';
import { createClient } from '@/lib/supabase/client';
import { useEntitlements } from '@/hooks/useEntitlements';
import PermissionModal from '@/components/ui/PermissionModal';

// Custom X (formerly Twitter) Logo Component
const XLogo = ({ size = 18, className }: { size?: number | string; className?: string }) => {
  const sizeValue = typeof size === 'string' ? parseInt(size, 10) || 18 : size;
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={sizeValue} 
      height={sizeValue} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
};

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 animate-fade-in-up ${
      type === 'success' ? 'bg-emerald-50/90 text-emerald-700 border border-emerald-200' : 'bg-red-50/90 text-red-700 border border-red-200'
    }`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span className="font-sans text-sm font-medium">{message}</span>
    </div>
  );
};

interface InputGroupProps {
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  type?: string;
  placeholder?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  defaultValue?: string;
}

const InputGroup = ({ label, icon: Icon, type = "text", placeholder, value, onChange, disabled = false, defaultValue }: InputGroupProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hasClearedRef = React.useRef(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!disabled && !hasClearedRef.current && defaultValue && value === defaultValue) {
      hasClearedRef.current = true;
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: '' }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
      e.target.select();
    }
  };

  return (
    <div className="space-y-2 group">
      <label className="text-sm font-semibold text-slate-700 font-brand ml-1">{label}</label>
      <div className={`relative flex items-center transition-all duration-300 ${disabled ? 'opacity-60' : ''}`}>
        <div className="absolute left-4 text-slate-400 group-focus-within:text-[#FF6B3D] transition-colors">
          <Icon size={18} />
        </div>
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={defaultValue || placeholder}
          className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-slate-700 font-sans placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B3D]/50 focus:ring-4 focus:ring-[#FF6B3D]/10 hover:bg-white/80 transition-all shadow-sm"
        />
      </div>
    </div>
  );
};

interface SocialInputProps {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  defaultValue?: string;
}

const SocialInput = ({ icon: Icon, placeholder, value, onChange, prefix, defaultValue }: SocialInputProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hasClearedRef = React.useRef(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!hasClearedRef.current && defaultValue && value === defaultValue) {
      hasClearedRef.current = true;
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
      e.target.select();
    }
  };

  return (
    <div className="relative group flex items-center">
      <div className="absolute left-4 text-slate-400 group-focus-within:text-[#FF6B3D] transition-colors z-10">
        <Icon size={18} />
      </div>
      <div className="flex w-full bg-white/50 border border-slate-200 rounded-2xl overflow-hidden focus-within:border-[#FF6B3D]/50 focus-within:ring-4 focus-within:ring-[#FF6B3D]/10 transition-all shadow-sm hover:bg-white/80">
        {prefix && (
          <div className="bg-slate-50/50 pl-11 pr-3 py-3.5 border-r border-slate-100 text-slate-500 font-sans text-sm select-none flex items-center">
            {prefix}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          placeholder={defaultValue || placeholder}
          className={`w-full py-3.5 bg-transparent text-slate-700 font-sans placeholder:text-slate-400 focus:outline-none ${!prefix ? 'pl-11 pr-4' : 'px-3'}`}
        />
      </div>
    </div>
  );
};

interface BioTextareaProps {
  rows?: number;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  defaultValue?: string;
}

const BioTextarea = ({ rows = 3, placeholder, value, onChange, defaultValue }: BioTextareaProps) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const hasClearedRef = React.useRef(false);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!hasClearedRef.current && defaultValue && value === defaultValue) {
      hasClearedRef.current = true;
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: '' }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
      e.target.select();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      placeholder={defaultValue || placeholder}
      className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-700 font-sans placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B3D]/50 focus:ring-4 focus:ring-[#FF6B3D]/10 hover:bg-white/80 transition-all shadow-sm resize-none"
      value={value}
      onChange={onChange}
      onFocus={handleFocus}
    ></textarea>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
}

const TabButton = ({ active, onClick, icon: Icon, label }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-4 rounded-2xl transition-all duration-300 group ${
      active 
        ? 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white shadow-lg shadow-orange-500/30' 
        : 'hover:bg-white/60 text-slate-500 hover:text-slate-800'
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-[#FF6B3D] transition-colors'} />
    <span className={`font-brand font-bold text-lg ${active ? 'text-white' : ''}`}>{label}</span>
    {active && <ChevronRight size={18} className="ml-auto opacity-80" />}
  </button>
);

interface Profile {
  avatar: string;
  nickname: string;
  bio: string;
  email: string;
  socials: {
    x: string;
    instagram: string;
    linkedin: string;
    website: string;
  };
}

interface HostProfile {
  name: string;
  avatar: string;
  bio: string;
  email: string;
  socials: {
    website: string;
  };
}

export default function SettingPage() {
  const router = useRouter();
  const { canAccessCommunity } = useEntitlements();
  const [activeTab, setActiveTab] = useState<'profile' | 'host' | 'security'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleViewChange = (view: 'events' | 'communities' | 'my-events' | 'my-communities') => {
    if ((view === 'communities' || view === 'my-communities') && !canAccessCommunity) {
      setShowPermissionModal(true);
      return;
    }
    
    router.push(`/home?view=${view}`);
  };

  // Auto close toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // User Profile Data - Initialize with empty values so placeholders show in gray
  const [profile, setProfile] = useState<Profile>({
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    nickname: '',
    bio: '',
    email: '',
    socials: {
      x: '',
      instagram: '',
      linkedin: '',
      website: ''
    }
  });

  // Fetch user profile from Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get user info from auth metadata (Google account)
          const userMetadata = session.user.user_metadata;
          const email = session.user.email || '';
          
          // Get profile from profiles table
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, email')
            .eq('id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching profile:', error);
          }

          // Use profile data or fallback to auth metadata
          const displayName = profileData?.full_name || userMetadata?.full_name || userMetadata?.name || '';
          const avatarUrl = profileData?.avatar_url || userMetadata?.avatar_url || userMetadata?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80';
          const profileEmail = profileData?.email || email;

          setProfile(prev => ({
            ...prev,
            nickname: displayName,
            avatar: avatarUrl,
            email: profileEmail
          }));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Handle avatar upload
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', type: 'error' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Image size cannot exceed 5MB', type: 'error' });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('User not logged in');
      }

      // Create a unique file name using user ID (so we can replace old avatar)
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}.${fileExt}`;
      const filePath = fileName;

      // Delete old avatar if exists (optional, but helps with storage management)
      // We'll use upsert instead to overwrite
      
      // Upload to Supabase Storage (use upsert to overwrite existing file)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing file
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Provide more helpful error messages
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('Storage bucket not configured. Please contact support.');
        }
        throw new Error(uploadError.message || 'Failed to upload avatar');
      }

      // Get public URL (use the path from upload response if available, otherwise use filePath)
      const uploadedPath = uploadData?.path || filePath;
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadedPath);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message || 'Failed to update profile');
      }

      // Update local state
      setProfile(prev => ({
        ...prev,
        avatar: publicUrl
      }));

      setToast({ message: 'Avatar updated successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      setToast({ message: error.message || 'Failed to upload avatar', type: 'error' });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Host/Organization Profile Data - Initialize with empty values so placeholders show in gray
  const [hostProfile, setHostProfile] = useState<HostProfile>({
    name: '',
    avatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=256&h=256&q=80',
    bio: '',
    email: '',
    socials: {
      website: ''
    }
  });

  const handleProfileUpdate = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: { ...prev[parent as keyof Profile] as any, [child]: value }
      }));
    } else {
      setProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleHostUpdate = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setHostProfile(prev => ({
        ...prev,
        [parent]: { ...prev[parent as keyof HostProfile] as any, [child]: value }
      }));
    } else {
      setHostProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setToast({ message: 'User not logged in', type: 'error' });
        setIsLoading(false);
        return;
      }

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.nickname,
          email: profile.email,
          // Note: avatar_url is updated separately when uploading avatar
        })
        .eq('id', session.user.id);

      if (profileError) {
        console.error('Update profile error:', profileError);
        setToast({ message: profileError.message || 'Failed to save changes', type: 'error' });
        setIsLoading(false);
        return;
      }

      setToast({ message: 'Changes saved successfully!', type: 'success' });
      
      // Refresh the page after showing toast
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Save failed:', error);
      setToast({ message: error.message || 'Failed to save changes', type: 'error' });
      setIsLoading(false);
    }
  };

  const handlePasswordReset = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setToast({ message: 'Reset link sent to email!', type: 'success' });
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 relative overflow-hidden font-sans selection:bg-[#FF6B3D]/20 selection:text-[#FF6B3D]">
      <Navbar currentView="settings" onViewChange={handleViewChange} />
      <PermissionModal 
        isOpen={showPermissionModal} 
        onClose={() => setShowPermissionModal(false)} 
      />
      <BgBlobs />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-8 md:pt-28 md:pb-12 min-h-screen flex flex-col">

        <div className="flex-1 grid md:grid-cols-12 gap-6 items-start">
          
          {/* Sidebar Navigation */}
          <div className="md:col-span-4 lg:col-span-3 space-y-4">
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-4 rounded-3xl shadow-xl shadow-slate-200/50">
              <div className="mb-6 px-2 pt-2">
                <h2 className="font-brand font-bold text-2xl text-slate-900">Settings</h2>
                <p className="text-slate-500 text-sm mt-1">Manage your presence</p>
              </div>
              <nav className="space-y-2">
                <TabButton 
                  active={activeTab === 'profile'} 
                  onClick={() => setActiveTab('profile')} 
                  icon={User} 
                  label="My Profile" 
                />
                <TabButton 
                  active={activeTab === 'host'} 
                  onClick={() => setActiveTab('host')} 
                  icon={Building2} 
                  label="Host Identity" 
                />
                <TabButton 
                  active={activeTab === 'security'} 
                  onClick={() => setActiveTab('security')} 
                  icon={Lock} 
                  label="Security" 
                />
              </nav>
            </div>

          </div>

          {/* Main Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-6 md:p-10 min-h-[600px] relative transition-all duration-500">
              
              {/* --- 1. My Profile Tab --- */}
              {activeTab === 'profile' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-8 border-b border-slate-100">
                    <div className="relative group">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        disabled={isUploadingAvatar || isLoadingUser}
                      />
                      {isLoadingUser ? (
                        <div className="w-28 h-28 rounded-full bg-slate-200 animate-pulse"></div>
                      ) : (
                        <>
                          <div className="w-28 h-28 rounded-full p-1 bg-white shadow-xl shadow-slate-200 overflow-hidden ring-4 ring-slate-50 group-hover:ring-[#FF6B3D]/20 transition-all">
                            {isUploadingAvatar ? (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                <div className="w-8 h-8 border-2 border-[#FF6B3D] border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <img 
                                src={profile.avatar} 
                                alt="Avatar" 
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  // Fallback to default avatar if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80';
                                }}
                              />
                            )}
                          </div>
                          <button
                            onClick={handleAvatarClick}
                            disabled={isUploadingAvatar || isLoadingUser}
                            className="absolute bottom-1 right-1 bg-[#FF6B3D] text-white p-2.5 rounded-full shadow-lg shadow-orange-500/30 hover:scale-110 hover:rotate-12 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0"
                          >
                            <Camera size={18} />
                          </button>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-brand font-bold text-slate-900">Personal Profile</h2>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">User</span>
                      </div>
                      <p className="text-slate-500 max-w-md">This is your personal identity used for joining events.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <InputGroup 
                        label="Display Name" 
                        icon={User} 
                        placeholder="e.g. Sarah Connor"
                        value={profile.nickname}
                        onChange={(e) => handleProfileUpdate('nickname', e.target.value)}
                        defaultValue="AlexDesign"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 font-brand ml-1 mb-2 block">Short Bio</label>
                      <BioTextarea
                        rows={3}
                        placeholder="Tell us a bit about yourself..."
                        value={profile.bio}
                        onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                        defaultValue="Digital nomad & Event enthusiast. Exploring the world one ticket at a time."
                      />
                      <p className="text-right text-xs text-slate-400 mt-2 font-medium">
                        {profile.bio.length}/160
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="font-brand font-bold text-lg text-slate-900 flex items-center gap-2">
                      <LinkIcon size={20} className="text-[#FF6B3D]" />
                      Social Connections
                    </h3>
                    <div className="grid gap-4">
                      {/* X (Formerly Twitter) */}
                      <SocialInput 
                        icon={XLogo} 
                        prefix="x.com/" 
                        placeholder="username"
                        value={profile.socials.x}
                        onChange={(e) => handleProfileUpdate('socials.x', e.target.value)}
                        defaultValue="alex_here"
                      />
                      
                      {/* LinkedIn (New) */}
                      <SocialInput 
                        icon={Linkedin} 
                        prefix="linkedin.com/in/" 
                        placeholder="username"
                        value={profile.socials.linkedin}
                        onChange={(e) => handleProfileUpdate('socials.linkedin', e.target.value)}
                        defaultValue="alex-designer"
                      />

                      <SocialInput 
                        icon={Instagram} 
                        prefix="instagram.com/" 
                        placeholder="username"
                        value={profile.socials.instagram}
                        onChange={(e) => handleProfileUpdate('socials.instagram', e.target.value)}
                        defaultValue="alex.grams"
                      />
                      <SocialInput 
                        icon={Globe} 
                        placeholder="Your personal website URL"
                        value={profile.socials.website}
                        onChange={(e) => handleProfileUpdate('socials.website', e.target.value)}
                        defaultValue="www.alex.design"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- 2. Host Identity Tab --- */}
              {activeTab === 'host' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-8 border-b border-slate-100">
                    <div className="relative group cursor-pointer">
                      {/* Square-ish shape for Organization/Host */}
                      <div className="w-28 h-28 rounded-3xl p-1 bg-white shadow-xl shadow-slate-200 overflow-hidden ring-4 ring-slate-50 group-hover:ring-[#FF6B3D]/20 transition-all">
                        <img 
                          src={hostProfile.avatar} 
                          alt="Host Avatar" 
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 bg-[#FF6B3D] text-white p-2.5 rounded-xl shadow-lg shadow-orange-500/30 hover:scale-110 transition-all z-10">
                        <Camera size={18} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-brand font-bold text-slate-900">Host Identity</h2>
                        <span className="px-2 py-0.5 rounded-lg bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider">Organizer</span>
                      </div>
                      <p className="text-slate-500 max-w-md">The public profile displayed on event pages you host. This can be your organization or your professional brand.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <InputGroup 
                        label="Host / Organization Name" 
                        icon={Building2} 
                        placeholder="e.g. Creative Mornings"
                        value={hostProfile.name}
                        onChange={(e) => handleHostUpdate('name', e.target.value)}
                        defaultValue="Creative Mornings"
                      />
                    </div>

                    <div className="md:col-span-2">
                       <InputGroup 
                        label="Public Contact Email" 
                        icon={Mail} 
                        placeholder="e.g. hello@events.com"
                        value={hostProfile.email}
                        onChange={(e) => handleHostUpdate('email', e.target.value)}
                        defaultValue="hello@creativemornings.com"
                      />
                      <p className="text-xs text-slate-400 mt-2 ml-1">
                        Visible to attendees who need to contact the organizer.
                      </p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 font-brand ml-1 mb-2 block">About the Host</label>
                      <BioTextarea
                        rows={4}
                        placeholder="Describe your organization or your hosting mission..."
                        value={hostProfile.bio}
                        onChange={(e) => handleHostUpdate('bio', e.target.value)}
                        defaultValue="A monthly breakfast lecture series for the creative community."
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="font-brand font-bold text-lg text-slate-900 flex items-center gap-2">
                      <LinkIcon size={20} className="text-[#FF6B3D]" />
                      Organization Links
                    </h3>
                    <div className="grid gap-4">
                      <SocialInput 
                        icon={Globe} 
                        placeholder="Official Website URL"
                        value={hostProfile.socials.website}
                        onChange={(e) => handleHostUpdate('socials.website', e.target.value)}
                        defaultValue="www.creativemornings.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- 3. Security Tab --- */}
              {activeTab === 'security' && (
                <div className="space-y-8 animate-fade-in max-w-2xl">
                  <div className="pb-6 border-b border-slate-100">
                    <h2 className="text-2xl font-brand font-bold text-slate-900 mb-2">Account Security</h2>
                    <p className="text-slate-500">Manage your login details and account recovery options.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50/80 rounded-3xl p-6 border border-slate-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-brand font-bold text-slate-800 text-lg">Email Address</h4>
                          <p className="text-slate-500 text-sm mt-1">Used for login and notifications.</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">Verified</span>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <InputGroup 
                            label="" 
                            icon={Mail} 
                            value={profile.email} 
                            disabled={true}
                          />
                        </div>
                        <button className="mt-2 px-5 h-[52px] border border-slate-200 rounded-2xl text-slate-600 font-semibold hover:bg-white hover:text-[#FF6B3D] hover:border-[#FF6B3D]/30 transition-all">
                          Change
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/60 rounded-3xl p-6 border border-slate-100 shadow-sm">
                      <h4 className="font-brand font-bold text-slate-800 text-lg mb-4">Password</h4>
                      <p className="text-slate-500 text-sm mb-6">
                        Forgot your password or need to update it? We'll send a secure link to your email to reset it.
                      </p>
                      
                      <button 
                        onClick={handlePasswordReset}
                        className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-700 font-bold hover:border-[#FF6B3D]/50 hover:text-[#FF6B3D] hover:shadow-lg hover:shadow-orange-500/10 transition-all w-full md:w-auto"
                      >
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                          <Lock size={20} />
                        </div>
                        Send Reset Link
                      </button>
                    </div>

                    <div className="bg-red-50/50 rounded-3xl p-6 border border-red-100 mt-8">
                       <h4 className="font-brand font-bold text-red-900 text-lg mb-2">Danger Zone</h4>
                       <p className="text-red-700/70 text-sm mb-4">Once you delete your account, there is no going back.</p>
                       <button className="text-red-600 text-sm font-semibold hover:underline">Delete Account</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Spacer to avoid overlap with floating CTA */}
        <div className="h-32 md:h-40" aria-hidden="true"></div>

        {/* Floating CTA */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30">
          <div className="flex flex-col items-center gap-3">
            {toast && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 animate-fade-in-up ${
                toast.type === 'success' ? 'bg-emerald-50/90 text-emerald-700 border border-emerald-200' : 'bg-red-50/90 text-red-700 border border-red-200'
              }`}>
                {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span className="font-sans text-sm font-medium">{toast.message}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button 
                className="px-5 py-3 rounded-full font-bold text-sm shadow-lg bg-white/80 text-slate-700 border border-white/60 hover:bg-white transition h-auto"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="px-10 py-4 rounded-full font-bold text-lg shadow-2xl transition-all hover:scale-105 hover:-translate-y-1 flex items-center gap-3 border-4 border-white/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed h-auto bg-[#FF6B3D] text-white hover:bg-[#FF855F]"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

