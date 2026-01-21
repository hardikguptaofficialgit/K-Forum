import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import wordleRoutes from './routes/wordle.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Allowed origins configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://k-forum-tau.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/K-Forum', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('🔗 MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('new-comment', (data) => {
    socket.to(data.postId).emit('comment-added', data);
  });

  socket.on('new-post', (data) => {
    socket.broadcast.emit('post-added', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wordle', wordleRoutes);


// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'K-Forum API is running!' });
});

const PORT = process.env.PORT || 5001;

// Start server - bind to 0.0.0.0 for Railway/cloud deployments
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;