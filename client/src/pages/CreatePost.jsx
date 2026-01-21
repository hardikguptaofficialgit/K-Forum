import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../services/axiosSetup';
import toast from 'react-hot-toast';
import { Send, Tag, Eye, EyeOff, Image, X, Calendar } from 'lucide-react';

const CreatePost = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    isAnonymous: false,
    eventDate: ''
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { id: 'academics', name: 'Academics', icon: '📚' },
    { id: 'events', name: 'Events', icon: '🎉' },
    { id: 'rants', name: 'Rants', icon: '😤' },
    { id: 'internships', name: 'Internships', icon: '💼' },
    { id: 'lost-found', name: 'Lost & Found', icon: '🔍' },
    { id: 'clubs', name: 'Clubs', icon: '🏛️' },
    { id: 'general', name: 'General', icon: '💬' },
    { id: 'Bookies', name: 'Bookies', icon: '🤖' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImageFiles = files.filter(file => {
      // Check Size (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB.`);
        return false;
      }
      // Check Type (PNG or JPG/JPEG only)
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error(`"${file.name}" is ignored. Only PNG and JPG images are allowed.`);
        return false;
      }
      return true;
    });

    const newImagePreviews = newImageFiles.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setSelectedImages([...selectedImages, ...newImagePreviews]);
    setImageFiles([...imageFiles, ...newImageFiles]);
  };

  const removeImage = (index) => {
    const newSelectedImages = [...selectedImages];
    const newImageFiles = [...imageFiles];

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(selectedImages[index].url);

    newSelectedImages.splice(index, 1);
    newImageFiles.splice(index, 1);

    setSelectedImages(newSelectedImages);
    setImageFiles(newImageFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('isAnonymous', formData.isAnonymous);
      if (formData.category === 'events' && formData.eventDate) {
        formDataToSend.append('eventDate', formData.eventDate);
      }

      imageFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      const response = await axios.post(
        '/api/posts',
        formDataToSend
      );

      // Handle different moderation statuses
      if (response.data.moderationStatus === 'PENDING_REVIEW') {
        toast.success('Your post has been submitted for review. It will be visible once approved by an admin.');
        navigate('/');
      } else {
        toast.success('Post created successfully!');
        navigate(`/post/${response.data.post._id}`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.response?.data?.reason) {
        // Handle moderation rejection
        toast.error(`Post rejected: ${error.response.data.reason}`);
      } else if (error.response?.data?.errors) {
        // Handle validation errors from server
        const errors = error.response.data.errors;
        Object.values(errors).forEach(error => {
          toast.error(error);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        // Handle client-side validation errors
        toast.error(error.message);
      } else {
        toast.error('Failed to create post');
      }
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="relative z-10 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-4 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/5">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4 animate-float">
              Create New Post
            </h1>
            <p className="text-gray-400 text-lg">Share your thoughts with the K-Forum community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength="200"
                className="w-full bg-white/5 text-white px-6 py-4 rounded-2xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all placeholder-gray-600 font-medium text-lg"
                placeholder="Give your post a catchy title..."
              />
              <div className="flex justify-end">
                <span className="text-xs text-gray-500 font-mono">
                  {formData.title.length}/200
                </span>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                Category
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 group overflow-hidden ${formData.category === category.id
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={formData.category === category.id}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
                    <span className={`text-sm font-bold ${formData.category === category.id ? 'text-emerald-400' : 'text-gray-400 group-hover:text-gray-200'}`}>
                      {category.name}
                    </span>
                    {formData.category === category.id && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent pointer-events-none" />
                    )}
                  </label>
                ))}
              </div>
            </div>


            {/* Event Date Picker - Only for Events */}
            {formData.category === 'events' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                  Event Date
                </label>
                <div className="relative group">
                  <Calendar className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors w-5 h-5 pointer-events-none" />
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required={formData.category === 'events'}
                    className="w-full bg-white/5 text-white pl-14 pr-6 py-4 rounded-2xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all placeholder-gray-600 appearance-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                Content
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                maxLength="5000"
                rows="8"
                className="w-full bg-white/5 text-white px-6 py-4 rounded-2xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all resize-none placeholder-gray-600 leading-relaxed"
                placeholder="What's on your mind? Share your story, confession, or question..."
              />
              <div className="flex justify-end">
                <span className="text-xs text-gray-500 font-mono">
                  {formData.content.length}/5000
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                Tags (Optional)
              </label>
              <div className="relative group">
                <Tag className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full bg-white/5 text-white pl-14 pr-6 py-4 rounded-2xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all placeholder-gray-600"
                  placeholder="academics, events, life (comma separated)"
                />
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 rounded-2xl border transition-all duration-300 gap-4 ${formData.isAnonymous
              ? 'bg-emerald-900/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
              : 'bg-white/5 border-white/5'
              }`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${formData.isAnonymous ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                  {formData.isAnonymous ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${formData.isAnonymous ? 'text-emerald-400' : 'text-gray-200'}`}>
                    {formData.isAnonymous ? 'Anonymous Mode' : 'Public Post'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {formData.isAnonymous
                      ? 'Your identity will be completely hidden.'
                      : 'Your name and profile will be visible.'
                    }
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500 border border-gray-600"></div>
              </label>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                Images (Max 5)
              </label>
              <div className="space-y-4">
                <label className="w-full flex flex-col items-center justify-center px-4 py-8 bg-white/5 text-gray-400 rounded-2xl border-2 border-white/10 border-dashed cursor-pointer hover:border-emerald-500/50 hover:bg-white/10 transition-all group">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Image className="w-8 h-8 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-emerald-300 transition-colors">Click to upload images</span>
                  <span className="text-xs text-gray-600 mt-1">JPG, PNG up to 5MB each</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {selectedImages.length > 0 && (
                  <div className={`${selectedImages.length === 1 ? '' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'}`}>
                    {selectedImages.map((image, index) => (
                      <div key={index} className={`relative group overflow-hidden glass-card rounded-2xl ${selectedImages.length === 1
                          ? 'w-full max-w-2xl mx-auto'
                          : 'aspect-square'
                        }`}>
                        <img
                          src={image.url}
                          alt={`Preview ${index + 1}`}
                          className={`w-full object-cover ${selectedImages.length === 1
                              ? 'h-auto max-h-[500px] object-contain bg-black/5'
                              : 'h-full'
                            }`}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full transform scale-0 group-hover:scale-100 transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-700/30">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-8 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.content || !formData.category}
                className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 sm:px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'Publishing...' : 'Publish Post'}
                  {!loading && <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </form>
        </div>
      </div >
    </div >
  );
};

export default CreatePost;