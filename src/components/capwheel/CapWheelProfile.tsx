import { useState, useEffect } from 'react';
import { Shield, Activity, Edit2, Save, Loader2, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { apiClient } from '../../api/client';
import { BOT_TIERS } from '../../core/DataOrchestrator';

export const CapWheelProfile = () => {
  const { user } = useAuthStore();
  const { walletBalance } = usePortfolioStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/api/profile');
        if (res.data.status === 'success') {
          setProfile(res.data.data.profile);
          setFormData({
            username: res.data.data.profile?.username || '',
            bio: res.data.data.profile?.bio || '',
            avatar_url: res.data.data.profile?.avatar_url || ''
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.put('/api/profile', formData);
      if (res.data.status === 'success') {
        setProfile(res.data.data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#0B1015]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              isEditing 
                ? 'bg-[#00FF9D] text-black hover:bg-[#00E88A]' 
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-[#0F1419] border border-white/5 rounded-xl p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center text-3xl font-bold text-black overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.email?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 uppercase mb-1">Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:border-[#00FF9D] outline-none"
                      placeholder="Enter username"
                    />
                  ) : (
                    <p className="text-lg font-medium text-white">{profile?.username || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 uppercase mb-1">Email</label>
                  <p className="text-lg font-medium text-slate-400">{user?.email}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 uppercase mb-1">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:border-[#00FF9D] outline-none h-24 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-sm text-slate-300">{profile?.bio || 'No bio yet.'}</p>
                  )}
                </div>
                 {isEditing && (
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 uppercase mb-1">Avatar URL</label>
                    <input
                      type="text"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:border-[#00FF9D] outline-none"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tiers Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00FF9D]" />
            Bot Tiers & Eligibility
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(BOT_TIERS).map(([key, tier]) => {
              const isLocked = walletBalance < tier.minimumStake;
              
              return (
                <div 
                  key={key} 
                  className={`
                    bg-[#0F1419] border rounded-xl p-4 transition-all relative overflow-hidden group
                    ${isLocked ? 'border-white/5 opacity-60' : 'border-white/5 hover:border-[#00FF9D]/30'}
                  `}
                >
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                      <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center mb-2">
                        <Lock className="w-5 h-5 text-slate-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Locked</span>
                      <span className="text-[10px] text-slate-500 mt-1">Req: ${tier.minimumStake.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield className="w-16 h-16" />
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${isLocked ? 'text-slate-400' : 'text-white'}`}>{tier.name}</h3>
                  <p className="text-xs text-slate-400 mb-4 uppercase tracking-wider">{key}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Min Stake</span>
                      <span className={`${isLocked ? 'text-slate-400' : 'text-[#00FF9D]'} font-mono`}>${tier.minimumStake.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Daily ROI</span>
                      <span className={`${isLocked ? 'text-slate-400' : 'text-white'} font-mono`}>{(tier.dailyRoiMin * 100).toFixed(2)}% - {(tier.dailyRoiMax * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lock Period</span>
                      <span className={`${isLocked ? 'text-slate-400' : 'text-white'}`}>{tier.capitalWithdrawalDays} Days</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
