import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  User, 
  Mail, 
  Lock, 
  Link as LinkIcon, 
  // Twitter removed
  Linkedin, 
  Instagram, 
  Globe, 
  ChevronRight, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Building2 
} from 'lucide-react';

// --- Components ---

// Custom X (formerly Twitter) Logo Component
const XLogo = ({ size = 18, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const Toast = ({ message, type, onClose }) => {
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

const InputGroup = ({ label, icon: Icon, type = "text", placeholder, value, onChange, disabled = false }) => (
  <div className="space-y-2 group">
    <label className="text-sm font-semibold text-slate-700 font-brand ml-1">{label}</label>
    <div className={`relative flex items-center transition-all duration-300 ${disabled ? 'opacity-60' : ''}`}>
      <div className="absolute left-4 text-slate-400 group-focus-within:text-[#FF6B3D] transition-colors">
        <Icon size={18} />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-slate-700 font-sans placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B3D]/50 focus:ring-4 focus:ring-[#FF6B3D]/10 hover:bg-white/80 transition-all shadow-sm"
      />
    </div>
  </div>
);

const SocialInput = ({ icon: Icon, placeholder, value, onChange, prefix }) => (
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
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full py-3.5 bg-transparent text-slate-700 font-sans placeholder:text-slate-400 focus:outline-none ${!prefix ? 'pl-11 pr-4' : 'px-3'}`}
      />
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }) => (
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

export default function App() {
  const [activeTab, setActiveTab] = useState('profile'); // profile | host | security
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // User Profile Data
  const [profile, setProfile] = useState({
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    nickname: 'AlexDesign',
    bio: 'Digital nomad & Event enthusiast. Exploring the world one ticket at a time.',
    email: 'alex@example.com',
    socials: {
      x: 'alex_here', // renamed from twitter
      instagram: 'alex.grams',
      linkedin: 'alex-designer', // added linkedin
      website: 'www.alex.design'
    }
  });

  // Host/Organization Profile Data
  const [hostProfile, setHostProfile] = useState({
    name: 'Creative Mornings',
    avatar: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=256&h=256&q=80',
    bio: 'A monthly breakfast lecture series for the creative community.',
    email: 'hello@creativemornings.com',
    socials: {
      website: 'www.creativemornings.com'
    }
  });

  const handleProfileUpdate = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleHostUpdate = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setHostProfile(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setHostProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setToast({ message: 'Changes saved successfully!', type: 'success' });
    }, 1500);
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
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-200/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#FF6B3D]/5 rounded-full blur-[100px]" />
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12 min-h-screen flex flex-col">
        {/* Header / Logo */}
        <header className="flex justify-between items-center mb-8 md:mb-12">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform duration-300">
              <span className="font-logo text-xl mt-1">H</span>
            </div>
            <h1 className="font-logo text-3xl text-[#FF6B3D] tracking-wide">HereNow</h1>
          </div>
          <button className="text-slate-400 hover:text-slate-600 font-medium font-brand flex items-center gap-2 transition-colors">
            <LogOut size={18} />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </header>

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

            {/* Completion Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden hidden md:block">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B3D] opacity-20 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <h3 className="font-brand font-bold text-lg mb-2 relative z-10">Profile Strength</h3>
              <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4 relative z-10">
                <div className="bg-[#FF6B3D] h-2 rounded-full w-3/4 shadow-[0_0_10px_#FF6B3D]"></div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                You're almost there! Add your Host Bio to reach 100%.
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-6 md:p-10 min-h-[600px] relative transition-all duration-500">
              
              {/* --- 1. My Profile Tab --- */}
              {activeTab === 'profile' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-8 border-b border-slate-100">
                    <div className="relative group cursor-pointer">
                      <div className="w-28 h-28 rounded-full p-1 bg-white shadow-xl shadow-slate-200 overflow-hidden ring-4 ring-slate-50 group-hover:ring-[#FF6B3D]/20 transition-all">
                        <img 
                          src={profile.avatar} 
                          alt="Avatar" 
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div className="absolute bottom-1 right-1 bg-[#FF6B3D] text-white p-2.5 rounded-full shadow-lg shadow-orange-500/30 hover:scale-110 hover:rotate-12 transition-all">
                        <Camera size={18} />
                      </div>
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
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 font-brand ml-1 mb-2 block">Short Bio</label>
                      <textarea
                        rows="3"
                        placeholder="Tell us a bit about yourself..."
                        className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-700 font-sans placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B3D]/50 focus:ring-4 focus:ring-[#FF6B3D]/10 hover:bg-white/80 transition-all shadow-sm resize-none"
                        value={profile.bio}
                        onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                      ></textarea>
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
                      />
                      
                      {/* LinkedIn (New) */}
                      <SocialInput 
                        icon={Linkedin} 
                        prefix="linkedin.com/in/" 
                        placeholder="username"
                        value={profile.socials.linkedin}
                        onChange={(e) => handleProfileUpdate('socials.linkedin', e.target.value)}
                      />

                      <SocialInput 
                        icon={Instagram} 
                        prefix="instagram.com/" 
                        placeholder="username"
                        value={profile.socials.instagram}
                        onChange={(e) => handleProfileUpdate('socials.instagram', e.target.value)}
                      />
                      <SocialInput 
                        icon={Globe} 
                        placeholder="Your personal website URL"
                        value={profile.socials.website}
                        onChange={(e) => handleProfileUpdate('socials.website', e.target.value)}
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
                      />
                    </div>

                    <div className="md:col-span-2">
                       <InputGroup 
                        label="Public Contact Email" 
                        icon={Mail} 
                        placeholder="e.g. hello@events.com"
                        value={hostProfile.email}
                        onChange={(e) => handleHostUpdate('email', e.target.value)}
                      />
                      <p className="text-xs text-slate-400 mt-2 ml-1">
                        Visible to attendees who need to contact the organizer.
                      </p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 font-brand ml-1 mb-2 block">About the Host</label>
                      <textarea
                        rows="4"
                        placeholder="Describe your organization or your hosting mission..."
                        className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-700 font-sans placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B3D]/50 focus:ring-4 focus:ring-[#FF6B3D]/10 hover:bg-white/80 transition-all shadow-sm resize-none"
                        value={hostProfile.bio}
                        onChange={(e) => handleHostUpdate('bio', e.target.value)}
                      ></textarea>
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
                            disabled={true} // Usually requires a separate flow to change
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

              {/* Action Bar */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end gap-4">
                <button className="px-6 py-3 rounded-2xl text-slate-500 font-medium hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-8 py-3 rounded-2xl bg-[#FF6B3D] text-white font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Lalezar&display=swap');
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.02em; }
        .font-logo { font-family: 'Lalezar', system-ui; }
        .font-sans { font-family: 'Inter', sans-serif; }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}