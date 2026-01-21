import React, { useState, useEffect } from 'react';
import axios from '../services/axiosSetup';
import { UserPlus, UserCheck, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BuddyConnect = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sentRequests, setSentRequests] = useState([]);

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        try {
            const response = await axios.get('/api/users/suggestions');
            setSuggestions(response.data);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (userId) => {
        try {
            await axios.post(`/api/users/connect/${userId}`);
            setSentRequests([...sentRequests, userId]);
            toast.success('Connection request sent!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        }
    };

    const getBranchAbbreviation = (branch) => {
        const branchMap = {
            'Computer Science Engineering': 'CSE',
            'Information Technology': 'IT',
            'Electronics and Communication': 'ECE',
            'Mechanical Engineering': 'ME',
            'Civil Engineering': 'CE',
            'Electrical Engineering': 'EE',
            'Biotechnology': 'Biotech',
            'Other': 'Other'
        };
        return branchMap[branch] || branch;
    };

    if (loading) return (
        <div className="glass-panel rounded-3xl p-6 mt-6 animate-pulse">
            <div className="h-6 w-32 bg-white/5 rounded mb-4"></div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5"></div>
                        <div className="space-y-2">
                            <div className="h-3 w-24 bg-white/5 rounded"></div>
                            <div className="h-2 w-16 bg-white/5 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (suggestions.length === 0) return null;

    return (
        <div className="glass-panel rounded-3xl p-5 mt-6 w-full">
            <h3 className="flex items-center gap-2 font-bold text-white mb-4">
                <Users className="w-5 h-5 text-emerald-400" />
                Buddy Connect
            </h3>
            <div className="space-y-4">
                {suggestions.map(user => (
                    <div key={user._id} className="flex items-center relative group min-h-[44px]">
                        <div className="flex items-center gap-3 pr-12">
                            <div className="relative shrink-0">
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full border border-gray-700 object-cover"
                                />
                                {sentRequests.includes(user._id) && (
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-[#0f1115]">
                                        <UserCheck className="w-2 h-2 text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <h4 className="text-sm font-bold text-gray-200 truncate w-28 lg:w-32">{user.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{getBranchAbbreviation(user.branch)} • {user.year} Year</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleConnect(user._id)}
                            disabled={sentRequests.includes(user._id)}
                            className={`
                                absolute right-0 top-1/2 -translate-y-1/2
                                p-2 rounded-xl transition-all duration-300
                                ${sentRequests.includes(user._id)
                                    ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                                    : 'bg-white/5 text-gray-400 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20'
                                }
                            `}
                            title={sentRequests.includes(user._id) ? "Request Sent" : "Connect"}
                        >
                            {sentRequests.includes(user._id) ? (
                                <UserCheck className="w-4 h-4" />
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BuddyConnect;
