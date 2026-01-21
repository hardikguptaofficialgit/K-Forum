import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../services/axiosSetup';
import toast from 'react-hot-toast';
import { MessageCircle, Eye, Clock, User, MoreVertical, Flag, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import ImageViewer from '../ImageViewer';
import PostReactions from './PostReactions';
import confetti from 'canvas-confetti';

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // Bookies voting state
  const [upvoteCount, setUpvoteCount] = useState(post.upvoteCount || 0);
  const [downvoteCount, setDownvoteCount] = useState(post.downvoteCount || 0);
  const [isVoting, setIsVoting] = useState(false);
  const formatTime = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      academics: 'bg-blue-500',
      events: 'bg-purple-500',
      rants: 'bg-red-500',
      internships: 'bg-[#17d059]',
      'lost-found': 'bg-yellow-500',
      clubs: 'bg-indigo-500',
      general: 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const handleDelete = async () => {
    if (!user || !post.author || (user._id !== post.author._id && !user.isAdmin)) {
      toast.error('You do not have permission to delete this post');
      return;
    }

    try {
      await axios.delete(`/api/posts/${post._id}`);
      toast.success('Post deleted successfully');
      if (onDelete) onDelete(post._id);
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleReport = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!reportReason.trim()) {
      toast.error('Please provide a reason for reporting');
      return;
    }

    try {
      await axios.post(`/api/posts/${post._id}/report`, {
        reason: reportReason
      });
      toast.success('Post reported successfully');
      setShowReportModal(false);
      setReportReason('');
      setShowOptions(false);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to report post');
      }
    }
  };


  const handleInteraction = (e) => {
    // Only trigger if it's an events post
    if (post.category === 'events') {
      // We don't want to trigger this if clicking buttons/links
      if (e.target.closest('button') || e.target.closest('a')) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x, y },
        colors: ['#FFD700', '#FFA500', '#ffffff', '#FF4500'],
        gravity: 0.8,
        scalar: 1.2,
        ticks: 200
      });
    }
  };

  return (
    <div
      onClick={handleInteraction}
      className={`glass-card rounded-2xl p-4 sm:p-6 mb-6 hover:bg-white/5 transition-all duration-300 relative group border border-gray-700/30 ${post.category === 'events' ? 'golden-shine' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#17d059] to-emerald-600 rounded-full flex items-center justify-center overflow-hidden">
              {post.author?.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">
                {post.author ? (
                  <Link
                    to={`/user/${post.author._id}`}
                    className="hover:text-[#17d059] transition-colors"
                  >
                    {post.author.name} ({post.author.studentId})
                  </Link>
                ) : 'Anonymous'}
              </p>
              <p className="text-gray-400 text-sm flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(post.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(post.category)}`}>
              {post.category.replace('-', ' ').toUpperCase()}
            </span>
            {post.moderationStatus === 'flagged' && (
              <span className="px-3 py-1 rounded-full text-xs font-medium text-white bg-red-600 animate-pulse">
                FLAGGED
              </span>
            )}
            {post.moderationStatus === 'pending' && (
              <span className="px-3 py-1 rounded-full text-xs font-medium text-white bg-yellow-600">
                PENDING REVIEW
              </span>
            )}
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 hover:bg-gray-700 rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
              {showOptions && (
                <div className="absolute right-0 mt-2 w-48 glass-panel rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowReportModal(true);
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 flex items-center space-x-2"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Report Post</span>
                  </button>
                  {user && post.author && (user._id === post.author._id || user.isAdmin) && (
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/5 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Post</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <Link to={`/post/${post._id}`} className="block">
          <h3 className="text-xl font-semibold text-white mb-3 hover:text-[#17d059] transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-300 mb-4 line-clamp-3">
            {post.content.substring(0, 200)}...
          </p>
        </Link>
        {console.log('Post attachments:', post._id, post.attachments)}

        {/* Image attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className={`${post.attachments.length === 1 ? '' : 'grid grid-cols-2 sm:grid-cols-3 gap-2'}`}>
            {post.attachments.map((attachment, index) => (
              <div
                key={index}
                className={`relative group cursor-pointer overflow-hidden rounded-lg ${post.attachments.length === 1
                    ? 'w-full'
                    : 'aspect-square'
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedImageIndex(index);
                  setShowImageViewer(true);
                }}
              >
                <img
                  src={attachment.url}
                  alt={attachment.filename}
                  className={`w-full object-cover transition-transform duration-200 ${post.attachments.length === 1
                      ? 'max-h-[600px] h-auto object-contain bg-black/5'
                      : 'h-full group-hover:scale-110'
                    }`}
                />
                {index === 2 && post.attachments.length > 3 && (
                  <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                    <span className="text-white text-xl font-semibold">+{post.attachments.length - 3}</span>
                  </div>
                )}
              </div>
            )).slice(0, 3)}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && (
        <ImageViewer
          images={post.attachments.map(attachment => attachment.url)}
          initialIndex={selectedImageIndex}
          onClose={() => setShowImageViewer(false)}
        />
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-white/5 border border-white/5 text-[#17d059] text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-gray-400">
        <div className="flex items-center space-x-4">
          {post.category === 'Bookies' ? (
            /* Upvote/Downvote for Bookies category */
            <>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!user) {
                    toast.error('Please login to vote');
                    navigate('/login');
                    return;
                  }
                  if (isVoting) return;
                  setIsVoting(true);
                  try {
                    const res = await axios.post(`/api/posts/${post._id}/vote`, { voteType: 'up' });
                    setUpvoteCount(res.data.upvoteCount);
                    setDownvoteCount(res.data.downvoteCount);
                  } catch (error) {
                    toast.error('Failed to vote');
                  } finally {
                    setIsVoting(false);
                  }
                }}
                disabled={isVoting}
                className={`flex items-center space-x-1 hover:text-green-400 transition-colors ${isVoting ? 'opacity-50' : ''}`}
              >
                <ArrowUp className="w-5 h-5" />
                <span>{upvoteCount}</span>
              </button>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!user) {
                    toast.error('Please login to vote');
                    navigate('/login');
                    return;
                  }
                  if (isVoting) return;
                  setIsVoting(true);
                  try {
                    const res = await axios.post(`/api/posts/${post._id}/vote`, { voteType: 'down' });
                    setUpvoteCount(res.data.upvoteCount);
                    setDownvoteCount(res.data.downvoteCount);
                  } catch (error) {
                    toast.error('Failed to vote');
                  } finally {
                    setIsVoting(false);
                  }
                }}
                disabled={isVoting}
                className={`flex items-center space-x-1 hover:text-red-400 transition-colors ${isVoting ? 'opacity-50' : ''}`}
              >
                <ArrowDown className="w-5 h-5" />
                <span>{downvoteCount}</span>
              </button>
            </>
          ) : (
            /* Reactions for all other categories */
            <PostReactions
              postId={post._id}
              initialCounts={post.reactionCounts || {}}
              initialUserReaction={post.userReaction || null}
              totalReactions={post.totalReactions || 0}
            />
          )}
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentCount || 0}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Eye className="w-5 h-5" />
          <span>{post.viewCount || 0}</span>
        </div>
      </div>
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="glass-panel p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/10">
            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">Report Post</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please provide a reason..."
              className="w-full p-4 rounded-xl bg-white/5 text-white border border-white/10 focus:border-emerald-500/50 focus:outline-none mb-6 transition-all"
              rows="4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold transition-all"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;