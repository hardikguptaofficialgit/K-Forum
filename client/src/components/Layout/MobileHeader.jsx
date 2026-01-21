import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Gamepad2, PlusSquare, Search, User, Menu, X, Sparkles, Shield, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TrendingHashtags from '../TrendingHashtags';

const MobileHeader = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const handleTagClick = (tag) => {
        closeMenu();
        navigate(`/?search=${encodeURIComponent('#' + tag)}`);
    };

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/create-post', icon: PlusSquare, label: 'Create Post' },
        { path: '/calendar', icon: Calendar, label: 'Calendar' },
        { path: '/buddy-connect', icon: Users, label: 'Buddy Connect' },
        { path: '/wordle', icon: Gamepad2, label: 'K-Wordle' },
        { path: '/', icon: Search, label: 'Search' },
        { path: '/profile', icon: User, label: 'Profile' }
    ];

    if (user?.role === 'admin') {
        navItems.push({ path: '/admin', icon: Shield, label: 'Admin Dashboard' });
    }

    return (
        <>
            {/* Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-[60] glass-panel border-b border-gray-700/50 px-4 py-3 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="text-white font-black text-lg">K</span>
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Forum
                    </span>
                </div>

                <button
                    onClick={toggleMenu}
                    className="p-2 text-gray-300 hover:text-white transition-colors active:scale-95"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Menu Drawer */}
            <div
                className={`md:hidden fixed inset-0 z-[55] bg-gray-900/95 backdrop-blur-2xl transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
                    }`}
            >
                <div className="flex flex-col h-full pt-20 px-6 pb-8 overflow-y-auto">
                    {/* User Profile */}
                    {user && (
                        <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 rounded-2xl border border-white/10 shrink-0">
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff`}
                                alt={user.name}
                                className="w-12 h-12 rounded-full border-2 border-emerald-500/30"
                            />
                            <div>
                                <h3 className="text-white font-bold text-lg">{user.name}</h3>
                                <p className="text-emerald-400 text-sm font-medium">@{user.studentId}</p>
                            </div>
                        </div>
                    )}

                    {/* Nav Links */}
                    <nav className="space-y-2 mb-8 shrink-0">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.path}
                                onClick={closeMenu}
                                className={({ isActive }) => `
                                    flex items-center gap-4 p-4 rounded-xl transition-all duration-200
                                    ${isActive
                                        ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon className="w-6 h-6" strokeWidth={2.5} />
                                        <span className="font-bold text-lg">{item.label}</span>
                                        {isActive && <Sparkles className="w-4 h-4 ml-auto text-emerald-400 animate-pulse" />}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Trending Section */}
                    <div className="mt-4 pt-6 border-t border-gray-800">
                        <TrendingHashtags onTagClick={handleTagClick} />
                    </div>

                    <p className="text-center text-gray-600 text-xs mt-8 pb-4 shrink-0">
                        K-Forum v2.0 • Made with ❤️
                    </p>
                </div>
            </div>
        </>
    );
};
export default MobileHeader;
