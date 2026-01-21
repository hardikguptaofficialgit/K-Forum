import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/axiosSetup';
import toast from 'react-hot-toast';

const REACTIONS = [
    { type: 'like', emoji: '👍', label: 'Like', color: 'text-blue-500' },
    { type: 'love', emoji: '❤️', label: 'Love', color: 'text-red-500' },
    { type: 'haha', emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
    { type: 'wow', emoji: '😮', label: 'Wow', color: 'text-yellow-400' },
    { type: 'sad', emoji: '😢', label: 'Sad', color: 'text-yellow-600' },
    { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-orange-600' }
];

const PostReactions = ({ postId, initialCounts = {}, initialUserReaction = null, totalReactions = 0 }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showPicker, setShowPicker] = useState(false);
    const [reactionCounts, setReactionCounts] = useState(initialCounts);
    const [userReaction, setUserReaction] = useState(initialUserReaction);
    const [total, setTotal] = useState(totalReactions);
    const [isLoading, setIsLoading] = useState(false);

    // Long press handling for mobile
    const longPressTimer = useRef(null);
    const [isLongPress, setIsLongPress] = useState(false);

    // Hover delay timer to prevent picker from disappearing too quickly
    const hoverTimer = useRef(null);

    // Update state when props change (e.g., after page reload)
    useEffect(() => {
        setUserReaction(initialUserReaction);
        setReactionCounts(initialCounts);
        setTotal(totalReactions);
    }, [initialUserReaction, initialCounts, totalReactions]);

    const handleReaction = async (type) => {
        if (!user) {
            toast.error('Please login to react');
            navigate('/login');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`/api/posts/${postId}/react`, { type });
            setReactionCounts(response.data.reactionCounts);
            setUserReaction(response.data.userReaction);
            setTotal(response.data.totalReactions);
            setShowPicker(false);
        } catch (error) {
            console.error('Reaction error:', error);
            toast.error('Failed to add reaction');
        } finally {
            setIsLoading(false);
        }
    };

    // Long press handlers for mobile
    const handleTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            setIsLongPress(true);
            setShowPicker(true);
        }, 500); // 500ms for long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }

        // If it was a quick tap (not long press), toggle reaction
        if (!isLongPress && !showPicker) {
            if (userReaction) {
                handleReaction(userReaction); // Remove current reaction
            } else {
                handleReaction('love'); // Default to love
            }
        }

        setIsLongPress(false);
    };

    const handleTouchMove = () => {
        // Cancel long press if user moves finger
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    // Get top 3 reactions with counts > 0
    const topReactions = REACTIONS
        .filter(r => reactionCounts[r.type] > 0)
        .sort((a, b) => reactionCounts[b.type] - reactionCounts[a.type])
        .slice(0, 3);

    const currentReaction = REACTIONS.find(r => r.type === userReaction);

    return (
        <div className="relative">
            {/* Main reaction button and count */}
            <div className="flex items-center gap-3">
                {/* Reaction button */}
                <div
                    className="relative"
                    onMouseEnter={() => {
                        // Clear any pending hide timer
                        if (hoverTimer.current) {
                            clearTimeout(hoverTimer.current);
                            hoverTimer.current = null;
                        }
                        setShowPicker(true);
                    }}
                    onMouseLeave={() => {
                        // Add delay before hiding picker
                        hoverTimer.current = setTimeout(() => {
                            setShowPicker(false);
                        }, 300); // 300ms delay
                    }}
                >
                    <button
                        onClick={() => {
                            if (userReaction) {
                                handleReaction(userReaction); // Toggle off
                            } else {
                                handleReaction('love'); // Default reaction
                            }
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 select-none hover:bg-white/5 ${isLoading ? 'opacity-50' : ''}`}
                    >
                        <span className="text-xl transition-transform hover:scale-125">
                            {userReaction ? currentReaction?.emoji : '🩶'}
                        </span>
                        <span className={`text-sm font-medium ${userReaction ? currentReaction?.color : 'text-gray-500'}`}>
                            {userReaction ? currentReaction?.label : 'React'}
                        </span>
                    </button>

                    {/* Reaction picker popup */}
                    {showPicker && (
                        <div
                            className="absolute bottom-full left-0 mb-2 z-50"
                            onTouchStart={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/10 flex gap-1 animate-scale-in">
                                {REACTIONS.map((reaction, index) => (
                                    <button
                                        key={reaction.type}
                                        onClick={() => handleReaction(reaction.type)}
                                        onTouchEnd={(e) => {
                                            e.stopPropagation();
                                            handleReaction(reaction.type);
                                        }}
                                        className={`p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-125 active:scale-150 ${userReaction === reaction.type ? 'bg-white/20 scale-110' : ''
                                            }`}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        title={reaction.label}
                                    >
                                        <span className="text-2xl block">{reaction.emoji}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Arrow pointer */}
                            <div className="absolute left-6 -bottom-1 w-3 h-3 bg-gray-900/95 border-r border-b border-white/10 transform rotate-45" />
                        </div>
                    )}
                </div>

                {/* Reaction summary */}
                {total > 0 && (
                    <div className="flex items-center gap-2">
                        {/* Stacked reaction emojis */}
                        <div className="flex -space-x-1">
                            {topReactions.map((reaction, index) => (
                                <span
                                    key={reaction.type}
                                    className="text-lg bg-gray-800 rounded-full p-0.5 border border-gray-700"
                                    style={{ zIndex: 3 - index }}
                                >
                                    {reaction.emoji}
                                </span>
                            ))}
                        </div>
                        <span className="text-gray-400 text-sm font-medium">
                            {total}
                        </span>
                    </div>
                )}
            </div>

            {/* CSS for animations */}
            {/* Styles moved to index.css */}
        </div>
    );
};

export default PostReactions;
