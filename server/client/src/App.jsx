import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import MainLayout from './components/Layout/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Admin from './pages/Admin';
import BuddyConnectPage from './pages/BuddyConnectPage';
import Wordle from './pages/Wordle';

import CalendarPage from './pages/CalendarPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

// Separate component to use Router context if needed
const MainContainer = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/create-post"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wordle"
          element={
            <ProtectedRoute>
              <Wordle />
            </ProtectedRoute>
          }
        />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/buddy-connect" element={<BuddyConnectPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151'
          }
        }}
      />
    </MainLayout >
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <ScrollToTop />
          <MainContainer />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;