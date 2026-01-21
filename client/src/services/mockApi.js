
// Simulated Database (In-Memory)
const mockDb = {
    users: [
        {
            _id: 'mock_demo_user',
            name: 'Demo User',
            email: 'dummy@kiit.ac.in',
            password: 'dummy123', // In real app this would be hashed
            studentId: '9999999',
            year: 4,
            branch: 'Computer Science Engineering',
            role: 'student',
            isVerified: true
        }
    ],
    posts: [
        {
            _id: 'mock_post_1',
            title: 'Welcome to K-Forum (Offline Mode)',
            content: 'This post is visible because you are in Offline Mode. The server might be down, but the app still works!',
            author: {
                _id: 'mock_demo_user',
                name: 'System Admin',
                studentId: '0000000',
                year: 4,
                branch: 'Admin'
            },
            category: 'general',
            tags: ['offline', 'system'],
            upvotes: [],
            downvotes: [],
            comments: [],
            createdAt: new Date().toISOString(),
            viewCount: 100
        }
    ]
};

export const mockApi = {
    login: async (data) => {
        console.log('[Mock API] Login attempt:', data.email);
        const user = mockDb.users.find(u => u.email === data.email);

        if (user) {
            // Simple password check (Mock only)
            if (data.password === user.password || data.password === 'dummy123') { // Allow standard dummy password
                return {
                    user: { ...user, password: undefined },
                    token: 'dummy-demo-token-offline',
                    message: 'Login successful (Offline Mode)'
                };
            }
        }

        // Auto-create dummy if specifically requested
        if (data.email === 'dummy@kiit.ac.in') {
            return {
                user: mockDb.users[0],
                token: 'dummy-demo-token-offline',
                message: 'Login successful (Offline Mode)'
            };
        }

        throw { response: { data: { message: 'Invalid credentials (Offline Mode)' } } };
    },

    register: async (data) => {
        console.log('[Mock API] Register attempt:', data.email);

        // Check dupe
        if (mockDb.users.find(u => u.email === data.email)) {
            throw { response: { data: { message: 'User already exists (Offline Mode)' } } };
        }

        const newUser = {
            _id: `mock_user_${Date.now()}`,
            ...data,
            isVerified: false, // In mock we might step to OTP
            role: 'student'
        };

        mockDb.users.push(newUser);
        return {
            userId: newUser._id,
            message: 'Registration successful! (Offline Mode)'
        };
    },

    verifyOtp: async (data) => {
        // In offline mode, accept ANY otp
        const user = mockDb.users.find(u => u._id === data.userId) || mockDb.users[mockDb.users.length - 1];
        if (user) {
            user.isVerified = true;
            return {
                user: { ...user, password: undefined },
                token: 'dummy-register-token-offline',
                message: 'Email verified (Offline Mode)'
            };
        }
        throw { response: { data: { message: 'Verification failed' } } };
    },

    getPosts: async () => {
        return {
            posts: mockDb.posts,
            currentPage: 1,
            totalPages: 1
        };
    },

    createPost: async (postData) => {
        console.log('[Mock API] Creating post:', postData.title);

        // Extract hashtags from content
        const hashtagRegex = /#(\w+)/g;
        const extractedHashtags = [];
        let match;
        const content = postData.content || '';
        while ((match = hashtagRegex.exec(content)) !== null) {
            extractedHashtags.push(match[1].toLowerCase());
        }

        // Parse manual tags
        const manualTags = postData.tags
            ? postData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
            : [];

        const allTags = [...new Set([...manualTags, ...extractedHashtags])];

        const newPost = {
            _id: `mock_post_${Date.now()}`,
            title: postData.title || 'Untitled Post',
            content: content,
            category: postData.category || 'general',
            tags: allTags,
            isAnonymous: postData.isAnonymous || false,
            author: mockDb.users[0],
            upvotes: [],
            downvotes: [],
            viewCount: 0,
            commentCount: 0,
            createdAt: new Date().toISOString(),
            moderationStatus: 'approved'
        };
        mockDb.posts.unshift(newPost);
        return newPost;
    }
};
