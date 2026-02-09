import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../services/axiosSetup';
import toast from 'react-hot-toast';
import { MessageCircle, Eye, Clock, User, Send, MoreVertical, Flag, Trash2, Image, X, ArrowUp, ArrowDown } from 'lucide-react';
import PostReactions from '../components/Posts/PostReactions';
import ImageViewer from '../components/ImageViewer';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  // Bookies voting state
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAnonymousComment, setIsAnonymousComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [showCommentOptions, setShowCommentOptions] = useState(null);
  const [commentImageFiles, setCommentImageFiles] = useState([]);
  const [commentImagePreviews, setCommentImagePreviews] = useState([]);
  const [viewerImages, setViewerImages] = useState([]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`/api/posts/${id}`);
      setPost(response.data);
      // Initialize vote counts for Bookies
      setUpvoteCount(response.data.upvoteCount || 0);
      setDownvoteCount(response.data.downvoteCount || 0);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Post not found');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/posts/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    try {
      const response = await axios.post(`/api/posts/${id}/vote`, {
        voteType
      });
      setPost({
        ...post,
        upvoteCount: response.data.upvoteCount,
        downvoteCount: response.data.downvoteCount
      });
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleDeletePost = async () => {
    if (!user || (user._id !== post.author._id && !user.isAdmin)) {
      toast.error('You do not have permission to delete this post');
      return;
    }

    try {
      await axios.delete(`/api/posts/${id}`);
      toast.success('Post deleted successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleReportPost = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!reportReason.trim()) {
      toast.error('Please provide a reason for reporting');
      return;
    }

    try {
      await axios.post(`/api/posts/${id}/report`, {
        reason: reportReason
      });
      toast.success('Post reported successfully');
      setShowReportModal(false);
      setReportReason('');
      setShowPostOptions(false);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to report post');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) {
      toast.error('Please login to delete comment');
      return;
    }

    try {
      await axios.delete(`/api/posts/${id}/comments/${commentId}`);
      setComments(comments.filter(comment => comment._id !== commentId));
      setPost({
        ...post,
        commentCount: post.commentCount - 1
      });
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleReportComment = async (commentId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await axios.post(`/api/posts/${id}/comments/${commentId}/report`);
      toast.success('Comment reported successfully');
      setShowCommentOptions(null);
    } catch (error) {
      toast.error('Failed to report comment');
    }
  };

  const handleCommentImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + commentImageFiles.length > 5) {
      toast.error('Maximum 5 images allowed per comment');
      return;
    }

    const newFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB`);
        return false;
      }
      return true;
    });

    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setCommentImageFiles([...commentImageFiles, ...newFiles]);
    setCommentImagePreviews([...commentImagePreviews, ...newPreviews]);
  };

  const removeCommentImage = (index) => {
    const newFiles = [...commentImageFiles];
    const newPreviews = [...commentImagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setCommentImageFiles(newFiles);
    setCommentImagePreviews(newPreviews);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    setSubmittingComment(true);
    try {
      const formData = new FormData();
      formData.append('content', newComment);
      formData.append('isAnonymous', post.category === 'Bookies' ? 'false' : isAnonymousComment.toString());

      commentImageFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await axios.post(
        `/api/posts/${id}/comments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setComments([response.data, ...comments]);
      setNewComment('');
      setCommentImageFiles([]);
      setCommentImagePreviews([]);
      setPost({
        ...post,
        commentCount: post.commentCount + 1
      });
      toast.success('Comment added successfully!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

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
      internships: 'bg-[#a78bfa]',
      'lost-found': 'bg-yellow-500',
      clubs: 'bg-indigo-500',
      general: 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#a78bfa]"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Post not found</h2>
          <Link to="/" className="text-[#a78bfa] hover:text-violet-400">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="glass-panel p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/10">
            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">Report Post</h3>
            <p className="text-gray-400 mb-6 text-sm">Help us understand what's wrong with this post. Your report is anonymous.</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="E.g. Discriminatory language, harassment, spam..."
              className="w-full p-4 rounded-2xl bg-white/5 text-white border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 focus:outline-none mb-6 transition-all placeholder-gray-600 resize-none"
              rows="4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="px-6 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleReportPost}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8">
        {/* Post */}
        <div className="glass-panel rounded-2xl p-4 sm:p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#a78bfa] to-violet-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {post.author ? `${post.author.name} (${post.author.studentId})` : 'Anonymous'}
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
                <div className="relative">
                  <button
                    onClick={() => setShowPostOptions(!showPostOptions)}
                    className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  {showPostOptions && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
                      <button
                        onClick={handleReportPost}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center space-x-2 rounded-t-lg"
                      >
                        <Flag className="w-4 h-4" />
                        <span>Report Post</span>
                      </button>
                      {user && post.author && (user._id === post.author._id || user.isAdmin) && (
                        <button
                          onClick={handleDeletePost}
                          className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center space-x-2 rounded-b-lg"
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

          <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>

          <div className="space-y-6">
            <div className="text-gray-300 mb-6 whitespace-pre-wrap">
              {post.content}
            </div>

            {/* Image attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {post.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer aspect-square overflow-hidden rounded-lg"
                    onClick={() => {
                      setViewerImages(post.attachments.map(a => a.url));
                      setSelectedImageIndex(index);
                      setShowImageViewer(true);
                    }}
                  >
                    <img
                      src={attachment.url}
                      alt={attachment.filename}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-200" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Image className="w-8 h-8 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Image Viewer */}
            {showImageViewer && (
              <ImageViewer
                images={viewerImages}
                initialIndex={selectedImageIndex}
                onClose={() => setShowImageViewer(false)}
              />
            )}
          </div>
        </div>

        {
          post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/5 border border-white/5 text-[#a78bfa] text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )
        }

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {post.category === 'Bookies' ? (
              /* Upvote/Downvote for Bookies */
              <>
                <button
                  onClick={async () => {
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
                  className={`flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors ${isVoting ? 'opacity-50' : ''}`}
                >
                  <ArrowUp className="w-5 h-5" />
                  <span>{upvoteCount}</span>
                </button>
                <button
                  onClick={async () => {
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
                  className={`flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors ${isVoting ? 'opacity-50' : ''}`}
                >
                  <ArrowDown className="w-5 h-5" />
                  <span>{downvoteCount}</span>
                </button>
              </>
            ) : (
              <PostReactions
                postId={post._id}
                initialCounts={post.reactionCounts || {}}
                initialUserReaction={post.userReaction || null}
                totalReactions={post.totalReactions || 0}
              />
            )}
            <div className="flex items-center space-x-2 text-gray-400">
              <MessageCircle className="w-5 h-5" />
              <span>{post.commentCount || 0}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <Eye className="w-5 h-5" />
            <span>{post.viewCount || 0}</span>
          </div>
        </div>
      </div >

      {/* Add Comment */}
      {
        user && (
          <div className="glass-panel rounded-2xl p-4 sm:p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Add a Comment</h3>
            <form onSubmit={handleCommentSubmit}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-white/5 text-white px-4 py-3 rounded-lg border border-white/10 focus:border-[#a78bfa] focus:outline-none transition-colors resize-none"
                rows="4"
                required
              />
              <div className="flex flex-col space-y-4 mt-4">
                {/* Image Previews */}
                {commentImagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {commentImagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                        <img src={preview} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeCommentImage(index)}
                          className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {post.category !== 'Bookies' && (
                      <label className="flex items-center space-x-2 text-gray-400 cursor-pointer hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={isAnonymousComment}
                          onChange={(e) => setIsAnonymousComment(e.target.checked)}
                          className="rounded border-gray-600 text-[#a78bfa] focus:ring-[#a78bfa]"
                        />
                        <span className="text-sm">Comment anonymously</span>
                      </label>
                    )}

                    {post.category === 'Bookies' && (
                      <label className="flex items-center space-x-2 text-[#a78bfa] cursor-pointer hover:text-violet-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleCommentImageChange}
                          className="hidden"
                          id="comment-image-upload"
                        />
                        <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5 group">
                          <Image className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-bold">Add Answer Image (Max 10MB)</span>
                        </div>
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingComment || (!newComment.trim() && commentImageFiles.length === 0)}
                    className="w-full sm:w-auto bg-violet-500 hover:bg-violet-600 text-white px-6 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-violet-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span className="font-bold">{submittingComment ? 'Posting...' : 'Post Answer'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )
      }

      {/* Comments */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">
          Comments ({comments.length})
        </h3>
        {comments.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="glass-card rounded-2xl p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#a78bfa] to-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-white font-medium">
                        {comment.author ? `${comment.author.name} (${comment.author.studentId})` : 'Anonymous'}
                      </p>
                      <span className="text-gray-400 text-sm">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>

                    {/* Comment Image Attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 mb-3">
                        {comment.attachments.map((attachment, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-white/5 hover:border-violet-500/30 transition-all"
                            onClick={() => {
                              setViewerImages(comment.attachments.map(a => a.url));
                              setSelectedImageIndex(idx);
                              setShowImageViewer(true);
                            }}
                          >
                            <img src={attachment.url} alt="comment-img" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-1 text-gray-400">
                        <ArrowUp className="w-4 h-4" />
                        <span>{comment.upvoteCount || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-400">
                        <ArrowDown className="w-4 h-4" />
                        <span>{comment.downvoteCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowCommentOptions(showCommentOptions === comment._id ? null : comment._id)}
                    className="p-1 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                  {showCommentOptions === comment._id && (
                    <div className="absolute right-0 mt-2 w-48 glass-panel rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden">
                      <button
                        onClick={() => handleReportComment(comment._id)}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 flex items-center space-x-2"
                      >
                        <Flag className="w-4 h-4" />
                        <span>Report Comment</span>
                      </button>
                      {user && (user._id === (comment.author?._id) || user.isAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/5 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Comment</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div >
  );
};

export default PostDetail;