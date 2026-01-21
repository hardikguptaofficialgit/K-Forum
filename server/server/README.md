# K-Forum Backend

This is the backend API for the K-Forum platform, built with Node.js, Express, and MongoDB.

## Features

- User Authentication (JWT + OTP)
- Post Creation & Management
- Socket.IO for Real-time Updates
- Admin Dashboard APIs
- Wordle Game Integration
- AI-powered Content Moderation (Gemini)

## Setup

1.  Navigate to the `server` directory: `cd server`
2.  Install dependencies: `npm install`
3.  Create a `.env` file based on `.env.example`: `cp .env.example .env`
4.  Configure your environment variables:
    - `MONGODB_URI`: Your MongoDB connection string.
    - `JWT_SECRET`: A secret key for JWT signing.
    - `GEMINI_API_KEY`: API key for Google Gemini AI.
    - `CLIENT_URL`: The URL of your frontend (for CORS).

## Running the Server

- **Development**: `npm run dev` (starts server with nodemon)
- **Production**: `npm start` (starts server with node)

## API Documentation

- `POST /api/auth/register`: User registration.
- `POST /api/auth/login`: User login.
- `GET /api/posts`: Fetch all posts.
- `POST /api/posts`: Create a new post.
- `GET /api/health`: API health check.

## Deployment

### Vercel
This backend is configured to work with Vercel via the root `vercel.json` and `server/api/index.js`.

### Standalone (Render/Heroku/Railway)
1.  Connect your repository.
2.  Set the root directory to `server`.
3.  Install command: `npm install`
4.  Start command: `npm start`
5.  Configure Environment Variables in the service dashboard.
