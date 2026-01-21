import React from 'react';

const CategoryFilter = ({ selectedCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', name: 'All', icon: '🌟' },
    { id: 'academics', name: 'Academics', icon: '📚' },
    { id: 'events', name: 'Events', icon: '🎉' },
    { id: 'rants', name: 'Rants', icon: '😤' },
    { id: 'internships', name: 'Internships', icon: '💼' },
    { id: 'lost-found', name: 'Lost & Found', icon: '🔍' },
    { id: 'clubs', name: 'Clubs', icon: '🏛️' },
    { id: 'general', name: 'General', icon: '💬' }
  ];

  return (
    <div className="glass-panel rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Browse Categories</h3>
      <div className="space-y-1.5">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 relative group overflow-hidden ${selectedCategory === category.id
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <span className="text-xl group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
            <span className="font-bold text-sm tracking-wide uppercase">{category.name}</span>
            {selectedCategory === category.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;