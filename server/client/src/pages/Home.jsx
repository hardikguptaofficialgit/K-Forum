import React, { useState, useEffect } from 'react';
import axios from '../services/axiosSetup';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/Posts/PostCard';
import TrendingHashtags from '../components/TrendingHashtags';
import EventCalendar from '../components/EventCalendar';
import BuddyConnect from '../components/BuddyConnect';
import { Search, Filter, Tag, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Initialize state with strict validation
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('activeTab');
    return (saved === 'friends' || saved === 'confessions') ? saved : 'confessions';
  });

  const [selectedCategory, setSelectedCategory] = useState(() => {
    const savedTab = localStorage.getItem('activeTab');
    return savedTab === 'friends' ? 'Bookies' : 'all';
  });

  // Keep state active in local storage
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('activeTab', activeTab);
    }
  }, [activeTab]);

  // Categories (must match Post model enum)
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'academics', label: '📚 Academics' },
    { value: 'events', label: '🎉 Events' },
    { value: 'Confessions', label: '🥹 Confessions' },
    { value: 'internships', label: '💼 Internships' },
    { value: 'lost-found', label: '🔍 Lost & Found' },
    { value: 'clubs', label: '🏛️ Clubs' },
    { value: 'general', label: '💬 General' },
    { value: 'Bookies', label: '🤖 Bookies' }
  ];

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, searchTerm, sortBy, page, activeTab]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {
        category: selectedCategory,
        sortBy,
        page,
        limit: 10
      };

      if (searchTerm.trim().startsWith('#')) {
        params.tag = searchTerm.trim().substring(1);
      } else if (searchTerm.trim()) {
        params.search = searchTerm;
      }

      // Handle Tab-based filtering
      if (activeTab === 'confessions') {
        // Post Section: Exclude Bookies
        if (selectedCategory === 'all') {
          params.excludeCategory = 'Bookies';
        }
      } else if (activeTab === 'friends') {
        // Bookie Section: Show only Bookies
        // Force category to Bookies if users try to switch (though UI should prevent it)
        if (selectedCategory === 'all') {
          params.category = 'Bookies';
        }
      }

      const response = await axios.get('/api/posts', { params });

      setPosts(response.data.posts || []);
      setTotalPages(response.data.totalPages ?? 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setPage(1);
  };

  const handleCreatePost = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/create-post');
  };



  return (
    <div className="relative min-h-[calc(100vh-4rem)]">

      {/* Floating Action Button */}
      <button
        onClick={handleCreatePost}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 z-50 animate-bounce-in"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Top Header Area */}
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6 md:mb-8 mt-4">
        {/* Search & Sort Bar */}
        <div className="w-full md:flex-1 relative group order-2 md:order-1">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
          <div className="relative bg-[#0f1115] border border-white/5 rounded-2xl flex items-center p-2 shadow-xl">
            <Search className="text-gray-500 w-5 h-5 ml-4" />
            <input
              type="text"
              placeholder={activeTab === 'confessions' ? "Search posts..." : "Search bookies..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-white px-4 py-2.5 text-sm focus:outline-none placeholder-gray-600 font-medium"
            />

            {/* Divider */}
            <div className="w-px h-8 bg-white/10 mx-2" />

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent text-gray-400 text-xs font-bold px-4 py-2 outline-none cursor-pointer hover:text-white transition-colors appearance-none"
            >
              <option value="createdAt">Newest</option>
              <option value="upvotes">Top</option>
              <option value="commentCount">Hot</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 mr-4 pointer-events-none" />
          </div>
        </div>

        {/* Rebuilt Toggle Switch - Fixed Width Container */}
        <div className="bg-[#0f1115] border border-white/10 p-1 rounded-xl flex items-center relative shrink-0 h-[50px] w-full md:w-[260px] order-1 md:order-2">
          {/* Sliding Indicator Background */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-lg shadow-lg shadow-emerald-500/20 transition-all duration-300 ease-out ${activeTab === 'friends' ? 'translate-x-[100%] left-1' : 'left-1'
              }`}
          />

          <button
            onClick={() => {
              setActiveTab('confessions');
              setSelectedCategory('all');
              setPage(1);
            }}
            className={`relative z-10 flex-1 h-full rounded-lg text-xs font-bold uppercase tracking-widest transition-colors duration-300 flex items-center justify-center ${activeTab === 'confessions' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            Posts
          </button>

          <button
            onClick={() => {
              setActiveTab('friends');
              setSelectedCategory('Bookies');
              setPage(1);
            }}
            className={`relative z-10 flex-1 h-full rounded-lg text-xs font-bold uppercase tracking-widest transition-colors duration-300 flex items-center justify-center ${activeTab === 'friends' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            Bookies
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Filters (Sticky) */}
        <div className="col-span-1 lg:col-span-3">
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Compact Filter Card / Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full bg-[#0f1115] border border-white/5 rounded-3xl p-5 flex items-center justify-between hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                    <Filter className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white text-sm">Filters</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {selectedCategory === 'all' ? 'All Categories' : categories.find(c => c.value === selectedCategory)?.label}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <div
                className={`
                  absolute top-full left-0 right-0 mt-4 bg-[#0f1115] border border-white/5 rounded-3xl p-2 z-20 overflow-hidden transition-all duration-300 origin-top
                  ${isFilterOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'}
                `}
              >
                <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {activeTab === 'confessions' && (
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all ${selectedCategory === 'all' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      All Posts
                    </button>
                  )}
                  {categories
                    .filter(c => {
                      if (activeTab === 'confessions') {
                        return c.value !== 'all' && c.value !== 'Bookies';
                      } else {
                        return c.value === 'Bookies';
                      }
                    })
                    .map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => {
                          setSelectedCategory(cat.value);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all ${selectedCategory === cat.value ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Buddy Connect Widget for Desktop */}
            <div className="hidden lg:block">
              <BuddyConnect />
            </div>
          </div>
        </div>

        {/* Main Feed Column */}
        <div className="lg:col-span-5">



          {/* Posts Feed */}
          {loading ? (
            <div className="space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card rounded-3xl p-8 h-72 animate-pulse bg-gray-800/50" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-8">
              {posts.map((post, idx) => (
                <div key={post._id} style={{ animationDelay: `${idx * 100}ms` }} className="animate-bounce-in">
                  <PostCard
                    post={post}
                    onDelete={(deletedPostId) => {
                      setPosts(posts.filter(p => p._id !== deletedPostId));
                    }}
                  />
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-4 mt-12">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-6 py-3 rounded-xl glass-panel text-white disabled:opacity-30 hover:bg-white/10 transition-all font-bold"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-6 py-3 rounded-xl glass-panel text-white disabled:opacity-30 hover:bg-white/10 transition-all font-bold"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 px-6 glass-panel rounded-3xl border border-dashed border-gray-700">
              <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No posts found</h3>
              <p className="text-gray-400">Be the first to share something here.</p>
            </div>
          )}
        </div>

        {/* Right Column: Trending (Sticky) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-24 space-y-6">

            {/* Event Calendar */}
            <EventCalendar />

            {/* Trending Hashtags */}
            <div className="glass-panel rounded-3xl p-6 w-[250px] min-w-[250px]">
              <TrendingHashtags onTagClick={(tag) => {
                setSearchTerm(`#${tag}`);
                setPage(1);
              }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
