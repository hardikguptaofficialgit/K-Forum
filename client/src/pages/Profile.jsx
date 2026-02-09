import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../services/axiosSetup';
import PostCard from '../components/Posts/PostCard';
import { User, Mail, GraduationCap, Calendar, Trophy, MessageCircle, ThumbsUp, Edit3, Camera, Flame, Target, Gamepad2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { id: urlId } = useParams();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Use currentUser.id or currentUser._id if no ID is provided in URL
  const id = urlId || currentUser?.id || currentUser?._id;
  const [editData, setEditData] = useState({
    name: '',
    year: '',
    branch: ''
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const isOwnProfile = currentUser && (currentUser.id === id || currentUser._id === id);

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`/api/users/${id}`);
      setProfile(response.data);
      setEditData({
        name: response.data.name,
        year: response.data.year,
        branch: response.data.branch
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await axios.get(`/api/users/${id}/posts`);
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setAvatarPreview(URL.createObjectURL(file));
      handleAvatarUpload(file);
    }
  };

  const handleAvatarUpload = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.put(
        '/api/users/profile',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setProfile({ ...profile, ...response.data });
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to update profile picture');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/users/profile`, editData);
      setProfile({ ...profile, ...response.data });
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#a78bfa]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Profile not found</h2>
        </div>
      </div>
    );
  }

  const wordleStreak = profile.wordleStreak || { current: 0, max: 0, totalWins: 0 };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 sticky top-24">
              <div className="text-center mb-6">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="w-24 h-24 bg-gradient-to-r from-[#a78bfa] to-violet-600 rounded-full flex items-center justify-center overflow-hidden">
                    {(profile.avatar || avatarPreview) ? (
                      <img
                        src={avatarPreview || profile.avatar}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-[#a78bfa] p-2 rounded-full hover:bg-[#8b5cf6] transition-colors"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                {editMode ? (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-[#a78bfa] focus:outline-none"
                    />
                    <select
                      value={editData.year}
                      onChange={(e) => setEditData({ ...editData, year: e.target.value })}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-[#a78bfa] focus:outline-none"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                    <input
                      type="text"
                      value={editData.branch}
                      onChange={(e) => setEditData({ ...editData, branch: e.target.value })}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-[#a78bfa] focus:outline-none"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 bg-[#a78bfa] text-white py-2 rounded-lg hover:bg-[#8b5cf6] transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-white mb-2">{profile.name}</h1>
                    <p className="text-gray-400 mb-4">{profile.studentId}</p>
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditMode(true)}
                        className="bg-[#a78bfa] text-white px-4 py-2 rounded-lg hover:bg-[#8b5cf6] transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail className="w-5 h-5 text-[#a78bfa]" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <GraduationCap className="w-5 h-5 text-[#a78bfa]" />
                  <span>{profile.year}th Year • {profile.branch}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Calendar className="w-5 h-5 text-[#a78bfa]" />
                  <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Trophy className="w-5 h-5 text-[#a78bfa]" />
                  <span>{profile.reputation} Reputation</span>
                </div>
              </div>

              {/* 🔥 WORDLE STREAK SECTION */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-amber-400" />
                    Wordle Stats
                  </h3>
                  {isOwnProfile && (
                    <Link
                      to="/wordle"
                      className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Play Now →
                    </Link>
                  )}
                </div>

                {/* Fire Streak Display */}
                <div className={`relative p-4 rounded-xl mb-4 ${wordleStreak.current > 0
                  ? 'bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border border-orange-500/30'
                  : 'bg-gray-700/50 border border-gray-600'
                  }`}>
                  <div className="flex items-center justify-center gap-3">
                    <div className={`relative ${wordleStreak.current > 0 ? 'animate-pulse' : ''}`}>
                      <Flame
                        className={`w-12 h-12 ${wordleStreak.current > 0
                          ? 'text-orange-400 drop-shadow-lg'
                          : 'text-gray-500'
                          }`}
                        style={{
                          filter: wordleStreak.current > 0
                            ? 'drop-shadow(0 0 10px rgba(251, 146, 60, 0.5))'
                            : 'none'
                        }}
                      />
                      {wordleStreak.current > 0 && (
                        <div className="absolute -top-1 -right-1">
                          <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-4xl font-bold ${wordleStreak.current > 0
                        ? 'text-orange-400'
                        : 'text-gray-400'
                        }`}>
                        {wordleStreak.current}
                      </p>
                      <p className="text-sm text-gray-400">
                        {wordleStreak.current === 1 ? 'Day Streak' : 'Day Streak'}
                      </p>
                    </div>
                  </div>

                  {wordleStreak.current >= 7 && (
                    <div className="mt-3 text-center">
                      <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                        🔥 On Fire!
                      </span>
                    </div>
                  )}

                  {wordleStreak.current === 0 && wordleStreak.max > 0 && (
                    <p className="mt-2 text-center text-gray-500 text-sm">
                      Streak broken! Start a new one today.
                    </p>
                  )}
                </div>

                {/* Wordle Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center border border-gray-600">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-xl font-bold text-purple-400">{wordleStreak.max}</p>
                    <p className="text-xs text-gray-400">Best Streak</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center border border-gray-600">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-xl font-bold text-violet-400">{wordleStreak.totalWins}</p>
                    <p className="text-xs text-gray-400">Total Wins</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Forum Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#a78bfa]">{profile.postCount || 0}</div>
                    <div className="text-sm text-gray-400">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#a78bfa]">{profile.reputation || 0}</div>
                    <div className="text-sm text-gray-400">Points</div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              {profile.badges && profile.badges.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.map((badge, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#a78bfa]/10 text-[#a78bfa] text-sm rounded-full border border-[#a78bfa]/30"
                      >
                        {badge.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Logout Button */}
              {isOwnProfile && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 bg-red-500/10 text-red-500 py-3 rounded-xl hover:bg-red-500/20 transition-all duration-200 border border-red-500/20 font-semibold group"
                  >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Posts */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isOwnProfile ? 'Your Posts' : `${profile.name}'s Posts`}
              </h2>
              <p className="text-gray-400">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} • Only public posts are shown
              </p>
            </div>

            {posts.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                <p className="text-gray-400">
                  {isOwnProfile ? "You haven't created any posts yet." : "This user hasn't created any public posts yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;