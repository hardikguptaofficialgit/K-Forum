import React, { useState, useEffect, useRef } from 'react';
import axios from '../services/axiosSetup';
import { useAuth } from '../contexts/AuthContext';
import { Send, User, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Chat = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [polling, setPolling] = useState(0);

    // Fetch conversations
    useEffect(() => {
        fetchConversations();
    }, [polling]);

    // Poll for new messages every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setPolling(p => p + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Fetch messages when conversation selected
    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation._id);
        }
    }, [selectedConversation, polling]);

    // Scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const res = await axios.get('/api/chat/conversations');
            setConversations(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const res = await axios.get(`/api/chat/${conversationId}/messages`);
            // Only update if length changed to prevent jitter, valid for simple polling
            // Ideally check IDs but this is a simple implementation
            if (res.data.length !== messages.length || (messages.length > 0 && res.data[res.data.length - 1]._id !== messages[messages.length - 1]._id)) {
                setMessages(res.data);
            } else if (messages.length === 0 && res.data.length > 0) {
                setMessages(res.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            const res = await axios.post(`/api/chat/${selectedConversation._id}/messages`, {
                content: newMessage
            });
            setMessages([...messages, res.data]);
            setNewMessage('');
            fetchConversations(); // Update last message in sidebar
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const getOtherParticipant = (conversation) => {
        return conversation.participants.find(p => p._id !== user._id) || conversation.participants[0];
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6 max-w-7xl mx-auto p-4">
            {/* Conversations List */}
            <div className={`w-full md:w-1/3 glass-panel rounded-3xl overflow-hidden flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageCircle className="w-6 h-6 text-violet-400" />
                        Messages
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {conversations.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10 p-4">
                            No conversations yet. Connect with buddies to start chatting!
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const otherUser = getOtherParticipant(conv);
                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${selectedConversation?._id === conv._id
                                            ? 'bg-violet-500/20 border border-violet-500/30'
                                            : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800">
                                            {otherUser?.avatar ? (
                                                <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <User className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-left overflow-hidden">
                                        <h3 className="font-bold text-gray-200 truncate">{otherUser?.name || 'Unknown User'}</h3>
                                        <p className="text-sm text-gray-400 truncate">
                                            {conv.lastMessage?.sender === user._id ? 'You: ' : ''}
                                            {conv.lastMessage?.content || 'Started a conversation'}
                                        </p>
                                    </div>
                                    {conv.lastMessage && (
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`w-full md:w-2/3 glass-panel rounded-3xl overflow-hidden flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/20">
                            <button
                                onClick={() => setSelectedConversation(null)}
                                className="md:hidden text-gray-400 hover:text-white"
                            >
                                ← Back
                            </button>
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                                {getOtherParticipant(selectedConversation)?.avatar ? (
                                    <img src={getOtherParticipant(selectedConversation).avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{getOtherParticipant(selectedConversation)?.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                                    Online
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                            {messages.map(msg => {
                                const isMe = msg.sender._id === user._id;
                                return (
                                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl ${isMe
                                                ? 'bg-violet-500 text-white rounded-tr-none'
                                                : 'bg-white/10 text-gray-200 rounded-tl-none'
                                            }`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-violet-200' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/20">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-violet-500 hover:bg-violet-600 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 opacity-50" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Your Messages</h3>
                        <p>Select a conversation from the list to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
