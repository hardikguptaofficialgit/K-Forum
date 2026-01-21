import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../services/axiosSetup';
import { Shield, Users, MessageSquare, AlertTriangle, TrendingUp, Eye, CheckCircle, XCircle, Gamepad2, Plus, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Admin = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [reportedPosts, setReportedPosts] = useState([]);
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Wordle Management State
  const [wordleWords, setWordleWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [newWordDate, setNewWordDate] = useState('');
  const [newWordHint, setNewWordHint] = useState('');

  useEffect(() => {
    fetchStats();
    fetchReportedPosts();
    fetchFlaggedPosts();
    fetchWordleWords();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReportedPosts = async () => {
    try {
      const response = await axios.get('/api/admin/reported-posts');
      setReportedPosts(response.data);
    } catch (error) {
      console.error('Error fetching reported posts:', error);
    }
  };

  const fetchFlaggedPosts = async () => {
    try {
      const response = await axios.get('/api/admin/flagged-posts');
      setFlaggedPosts(response.data || []);
    } catch (error) {
      console.error('Error fetching flagged posts:', error);
      setFlaggedPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWordleWords = async () => {
    try {
      const response = await axios.get('/api/wordle/admin/words');
      setWordleWords(response.data);
    } catch (error) {
      console.error('Error fetching wordle words:', error);
    }
  };

  const handleModeratePost = async (postId, action) => {
    try {
      await axios.post(`/api/admin/moderate-post/${postId}`, { action });
      toast.success(`Post ${action}d successfully`);
      fetchReportedPosts();
      fetchFlaggedPosts();
    } catch (error) {
      console.error('Error moderating post:', error);
      toast.error('Failed to moderate post');
    }
  };

  const handleSetWordleWord = async (e) => {
    e.preventDefault();
    if (newWord.length !== 5) {
      toast.error('Word must be exactly 5 letters');
      return;
    }

    try {
      await axios.post('/api/wordle/admin/set-word', {
        word: newWord.toUpperCase(),
        date: newWordDate || undefined,
        hint: newWordHint || undefined
      });
      toast.success('Wordle word set successfully!');
      setNewWord('');
      setNewWordDate('');
      setNewWordHint('');
      fetchWordleWords();
    } catch (error) {
      console.error('Error setting wordle word:', error);
      toast.error('Failed to set wordle word');
    }
  };

  const handleDeleteWord = async (wordId) => {
    if (!confirm('Are you sure you want to delete this word?')) return;

    try {
      await axios.delete(`/api/wordle/admin/words/${wordId}`);
      toast.success('Word deleted');
      fetchWordleWords();
    } catch (error) {
      console.error('Error deleting word:', error);
      toast.error('Failed to delete word');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#17d059]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-[#17d059]" />
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-gray-400">
            Welcome back, {user.name}. Manage the K-Forum community effectively.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {['overview', 'moderation', 'wordle'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize flex items-center gap-2 ${activeTab === tab
                ? 'bg-[#17d059] text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              {tab === 'wordle' && <Gamepad2 className="w-4 h-4" />}
              {tab === 'moderation' && <AlertTriangle className="w-4 h-4" />}
              {tab === 'overview' && <TrendingUp className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats.totalUsers || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-[#17d059]" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Posts</p>
                    <p className="text-2xl font-bold text-white">{stats.totalPosts || 0}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-[#17d059]" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Comments</p>
                    <p className="text-2xl font-bold text-white">{stats.totalComments || 0}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-[#17d059]" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending Reviews</p>
                    <p className="text-2xl font-bold text-white">{(stats.pendingReports || 0) + flaggedPosts.length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Category Statistics */}
            {stats.categoryStats && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Posts by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.categoryStats.map((category) => (
                    <div key={category._id} className="text-center">
                      <p className="text-2xl font-bold text-[#17d059]">{category.count}</p>
                      <p className="text-gray-400 capitalize">{category._id.replace('-', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-8">
            {/* AI Flagged Posts */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                  <span>AI Flagged Posts ({flaggedPosts.length})</span>
                </h2>
                <p className="text-gray-400 text-sm mt-1">Posts flagged by AI for potential violations</p>
              </div>

              {flaggedPosts.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-[#17d059] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
                  <p className="text-gray-400">No flagged posts to review.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {flaggedPosts.map((post) => (
                    <div key={post._id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                          <p className="text-gray-300 mb-2 line-clamp-3">{post.content}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>By: {post.author ? post.author.name : 'Anonymous'}</span>
                            <span>Category: {post.category}</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                          FLAGGED
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleModeratePost(post._id, 'approve')}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleModeratePost(post._id, 'remove')}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Reported Posts */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <span>User Reported Posts ({reportedPosts.length})</span>
                </h2>
              </div>

              {reportedPosts.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-[#17d059] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Reports</h3>
                  <p className="text-gray-400">All posts are looking good!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {reportedPosts.map((post) => (
                    <div key={post._id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                          <p className="text-gray-300 mb-2 line-clamp-2">{post.content}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>By: {post.author ? post.author.name : 'Anonymous'}</span>
                            <span>Reports: {post.reports.length}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${post.moderationStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                          post.moderationStatus === 'flagged' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                          {post.moderationStatus.toUpperCase()}
                        </span>
                      </div>

                      {/* Display Report Reasons */}
                      {post.reports && post.reports.length > 0 && (
                        <div className="mb-4 bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                          <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Report Reasons:
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {post.reports.map((report, index) => (
                              <div key={index} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                                <p className="text-gray-300 text-sm">"{report.reason}"</p>
                                <p className="text-gray-500 text-xs mt-1">
                                  — Reported by {report.user?.name || 'Anonymous'}
                                  {report.reportedAt && ` on ${new Date(report.reportedAt).toLocaleDateString()}`}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleModeratePost(post._id, 'approve')}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleModeratePost(post._id, 'remove')}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wordle Management Tab */}
        {activeTab === 'wordle' && (
          <div className="space-y-6">
            {/* Set New Word */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-amber-400" />
                Set Daily Wordle
              </h2>

              <form onSubmit={handleSetWordleWord} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Word (5 letters) *
                    </label>
                    <input
                      type="text"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value.toUpperCase().slice(0, 5))}
                      maxLength={5}
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 focus:outline-none uppercase tracking-widest text-xl font-bold text-center"
                      placeholder="WORDS"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">{newWord.length}/5 letters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date (optional)
                    </label>
                    <input
                      type="date"
                      value={newWordDate}
                      onChange={(e) => setNewWordDate(e.target.value)}
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Leave empty for today</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hint (optional)
                    </label>
                    <input
                      type="text"
                      value={newWordHint}
                      onChange={(e) => setNewWordHint(e.target.value)}
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 focus:outline-none"
                      placeholder="A clue for players..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={newWord.length !== 5}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Set Wordle Word
                </button>
              </form>
            </div>

            {/* Recent Words */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-amber-400" />
                  Recent Wordle Words
                </h2>
              </div>

              {wordleWords.length === 0 ? (
                <div className="p-8 text-center">
                  <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Words Set</h3>
                  <p className="text-gray-400">Add your first daily word above!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {wordleWords.map((word) => (
                    <div key={word._id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                          {word.word.split('').map((letter, i) => (
                            <span
                              key={i}
                              className="w-10 h-10 bg-emerald-500 rounded flex items-center justify-center text-white font-bold text-lg"
                            >
                              {letter}
                            </span>
                          ))}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {new Date(word.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          {word.hint && (
                            <p className="text-gray-400 text-sm">💡 {word.hint}</p>
                          )}
                          <p className="text-gray-500 text-xs">
                            Set by: {word.createdBy?.name || 'Admin'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteWord(word._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;