import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../services/axiosSetup';
import toast from 'react-hot-toast';
import { Mail, Lock, KeyRound, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'newPassword' | 'success'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (email) => {
    return email.trim().toLowerCase().endsWith('@kiit.ac.in');
  };

  // Step 1: Submit email to get OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error('Only @kiit.ac.in email addresses are allowed.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() });
      setUserId(response.data.userId);
      setStep('otp');
      toast.success(response.data.message || 'Reset code sent to your email!');
    } catch (error) {
      console.error('Forgot Password Error:', error);
      toast.error(error.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code.');
      return;
    }

    // Move to new password step after OTP is entered
    setStep('newPassword');
    toast.success('Code verified! Now set your new password.');
  };

  // Step 3: Submit new password with OTP
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/reset-password', {
        userId,
        otp,
        newPassword
      });
      setStep('success');
      toast.success(response.data.message || 'Password reset successful!');
    } catch (error) {
      console.error('Reset Password Error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
      // If OTP is invalid/expired, go back to OTP step
      if (error.response?.status === 400) {
        setStep('otp');
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() });
      setUserId(response.data.userId);
      setOtp('');
      toast.success('A new reset code has been sent to your email!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10">
          
          {/* Step 1: Enter Email */}
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-[#17d059] to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
                <p className="text-gray-400">Enter your email to receive a reset code</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    KIIT Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-600 focus:border-[#17d059] focus:outline-none transition-colors"
                      placeholder="your.email@kiit.ac.in"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#17d059] to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-[#15b84f] hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-[#17d059]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : 'Send Reset Code'}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Enter OTP */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-[#17d059] to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Enter Reset Code</h1>
                <p className="text-gray-400">We sent a 6-digit code to</p>
                <p className="text-[#17d059] font-medium">{email}</p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength="6"
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-[#17d059] focus:outline-none transition-colors text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-[#17d059] to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-[#15b84f] hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-[#17d059]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Verify Code
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                    }}
                    className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-[#17d059] hover:text-emerald-400 transition-colors disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Enter New Password */}
          {step === 'newPassword' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-[#17d059] to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
                <p className="text-gray-400">Choose a strong password for your account</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength="6"
                      className="w-full bg-gray-700 text-white pl-10 pr-12 py-3 rounded-lg border border-gray-600 focus:border-[#17d059] focus:outline-none transition-colors"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength="6"
                      className="w-full bg-gray-700 text-white pl-10 pr-12 py-3 rounded-lg border border-gray-600 focus:border-[#17d059] focus:outline-none transition-colors"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            newPassword.length >= level * 3
                              ? level <= 2
                                ? 'bg-red-500'
                                : level === 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">
                      {newPassword.length < 6
                        ? 'Password too short (min 6 characters)'
                        : newPassword.length < 8
                        ? 'Weak password'
                        : newPassword.length < 12
                        ? 'Good password'
                        : 'Strong password'}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full bg-gradient-to-r from-[#17d059] to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-[#15b84f] hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-[#17d059]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Resetting...
                    </span>
                  ) : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('otp');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full text-gray-400 hover:text-white text-sm flex items-center justify-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to verification
                </button>
              </form>
            </>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-[#17d059] to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Password Reset!</h1>
                <p className="text-gray-400">Your password has been successfully reset.</p>
                <p className="text-gray-400 mt-2">You can now login with your new password.</p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-[#17d059] to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-[#15b84f] hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-[#17d059]/50 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Go to Login
              </button>
            </>
          )}

          {/* Back to login link (shown on email and otp steps) */}
          {(step === 'email' || step === 'otp') && (
            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Remember your password?{' '}
                <Link to="/login" className="text-[#17d059] hover:text-emerald-400 font-medium transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
