import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../services/axiosSetup';
import toast from 'react-hot-toast';
import { User, Book, Code, Mail, Calendar, Flame, Trophy, Target } from 'lucide-react';
import PostCard from '../components/Posts/PostCard';

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const [userResponse, postsResponse] = await Promise.all([
          axios.get(`/api/users/${id}`),
          axios.get(`/api/users/${id}/posts?page=${currentPage}`)
        ]);

        setUser(userResponse.data);
        setPosts(postsResponse.data.posts);
        setTotalPages(postsResponse.data.totalPages);
      } catch (error) {
        toast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id, currentPage]);

  const handlePostDelete = (deletedPostId) => {
    setPosts(posts.filter(post => post._id !== deletedPostId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#a78bfa] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">User not found</div>
      </div>
    );
  }

  const wordleStreak = user.wordleStreak || { current: 0, max: 0, totalWins: 0 };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-r from-[#a78bfa] to-violet-600 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-300">
                  <Mail className="w-5 h-5 mr-2 text-[#a78bfa]" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Code className="w-5 h-5 mr-2 text-[#a78bfa]" />
                  <span>{user.studentId}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Book className="w-5 h-5 mr-2 text-[#a78bfa]" />
                  <span>{user.branch}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-5 h-5 mr-2 text-[#a78bfa]" />
                  <span>Year {user.year}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats and Wordle Streak */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Forum Stats */}
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-2xl font-bold text-white">{user.postCount}</span>
                  <span className="ml-2 text-gray-300">Posts</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">{user.reputation}</span>
                  <span className="ml-2 text-gray-300">Reputation</span>
                </div>
              </div>

              {/* 🔥 Wordle Streak Display */}
              {wordleStreak.current > 0 && (
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30`}>
                  <Flame
                    className="w-6 h-6 text-orange-400 animate-pulse"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.6))' }}
                  />
                  <div className="text-center">
                    <span className="text-2xl font-bold text-orange-400">{wordleStreak.current}</span>
                    <span className="ml-2 text-gray-300 text-sm">Day Streak</span>
                  </div>
                  {wordleStreak.current >= 7 && (
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                      🔥
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Wordle Stats Row */}
            {(wordleStreak.max > 0 || wordleStreak.totalWins > 0) && (
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span>Best: <span className="text-white font-semibold">{wordleStreak.max}</span></span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Target className="w-4 h-4 text-violet-400" />
                  <span>Wins: <span className="text-white font-semibold">{wordleStreak.totalWins}</span></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User's Posts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-6">Posts</h2>
          {posts.length > 0 ? (
            <>
              {posts.map(post => (
                <PostCard key={post._id} post={post} onDelete={handlePostDelete} />
              ))}
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-8">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg ${currentPage === page
                        ? 'bg-[#a78bfa] text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No posts yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;