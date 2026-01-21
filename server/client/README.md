# K-Forum Frontend

This is the frontend client for the K-Forum platform, built with React, Vite, and TailwindCSS.

## Features

- Responsive Modern UI
- Real-time Post Feed
- User Authentication Flow
- Interest-based Buddy Connections
- Interactive Wordle Game
- Real-time Notifications (Socket.IO)

## Setup

1.  Navigate to the `client` directory: `cd client`
2.  Install dependencies: `npm install`
3.  Create a `.env` file based on `.env.example`: `cp .env.example .env`
4.  Configure your environment variables:
    - `VITE_BACKEND_API`: The full URL of your backend API (e.g., `https://api.yourdomain.com`).

## Running the Client

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Deployment

### Vercel
1.  Connect your repository.
2.  The `vercel.json` at the root will handle routing for both frontend and backend if deployed as a monorepo.

### Standalone (Netlify/Vercel/Cloudflare Pages)
1.  Connect your repository.
2.  Set the root directory to `client`.
3.  Build command: `npm run build`
4.  Output directory: `dist`
5.  Configure `VITE_BACKEND_API` in the service dashboard.
