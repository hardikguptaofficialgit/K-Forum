import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Mail, Flame, User, Settings, Shield, PlusSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user } = useAuth();

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        // { icon: Search, label: 'Search', path: '/search' },
        { icon: PlusSquare, label: 'Create', path: '/create-post' },
        { icon: Flame, label: 'Wordle', path: '/wordle', highlight: true },
        // { icon: Mail, label: 'Inbox', path: '/inbox' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    if (user?.role === 'admin') {
        navItems.push({ icon: Shield, label: 'Admin', path: '/admin' });
    }

    return (
        <div className={`
            hidden md:flex flex-col 
            ${isOpen ? 'w-64' : 'w-20'} 
            h-[96vh] fixed left-4 top-[2vh] 
            glass-dock rounded-3xl border border-gray-700/50 
            z-50 py-8 shadow-2xl 
            transition-all duration-300 ease-in-out
        `}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -right-3 top-[56px] -translate-y-1/2 bg-gray-800 border border-violet-500/30 text-violet-400 p-1 rounded-full shadow-lg hover:bg-gray-700 hover:scale-110 transition-all z-50"
            >
                {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Minimal Logo */}
            <div className={`flex items-center ${isOpen ? 'justify-start pl-4' : 'justify-center'} mb-12 transition-all duration-300`}>
                <div className="w-12 h-12 shrink-0 bg-gradient-to-tr from-violet-400 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <span className="text-white font-extrabold text-2xl">K</span>
                </div>
                <div className={`ml-4 overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                    <span className="text-xl font-bold text-white whitespace-nowrap">K-Forum</span>
                </div>
            </div>

            {/* Navigation Icons */}
            <nav className="flex-1 flex flex-col gap-4 w-full px-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            relative flex items-center group rounded-2xl transition-all duration-300 overflow-hidden
                            ${isOpen ? 'w-full px-4 py-3 justify-start' : 'w-12 h-12 justify-center'}
                            ${isActive
                                ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/40'
                                : 'text-gray-400 hover:bg-white/10 hover:text-white'
                            }
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`w-6 h-6 shrink-0 transition-transform ${!isOpen && 'group-hover:rotate-6'} ${item.highlight ? 'animate-pulse' : ''}`}
                                />

                                <span className={`ml-3 font-semibold whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 absolute'}`}>
                                    {item.label}
                                </span>

                                {/* Hover Tooltip (Only when collapsed) */}
                                {!isOpen && (
                                    <span className="absolute left-16 px-4 py-2 bg-gray-900 border border-violet-500/30 text-violet-400 text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl backdrop-blur-md">
                                        {item.label}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile Bubble */}
            {user && (
                <div className={`mt-auto relative group px-4 w-full transition-all duration-300 ${isOpen ? 'flex items-center gap-3 px-2' : ''}`}>
                    <div className="w-10 h-10 shrink-0 rounded-full border-2 border-violet-500/30 p-[2px] cursor-pointer hover:border-violet-400 transition-colors">
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=8b5cf6&color=fff`}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                        <p className="font-bold text-sm truncate text-white">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">@{user.studentId}</p>
                    </div>

                    {/* Profile Tooltip (Only when collapsed) */}
                    {!isOpen && (
                        <div className="absolute left-16 bottom-0 p-4 bg-gray-900 border border-gray-700 text-white rounded-2xl opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none w-48 shadow-2xl glass-card z-50">
                            <p className="font-bold text-lg truncate bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">@{user.studentId}</p>
                            <div className="mt-2 text-xs text-violet-500 font-mono">ONLINE / {user.role || 'STUDENT'}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Sidebar;
