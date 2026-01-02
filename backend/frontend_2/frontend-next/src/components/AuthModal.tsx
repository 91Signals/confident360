'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      onClose();
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const code = err?.code ? ` (${err.code})` : '';
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Pop-up blocked. Please allow pop-ups for this site.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please contact support.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('Unauthorized domain. Add this domain in Firebase Auth > Settings > Authorized domains.');
      } else {
        setError(`Failed to sign in with Google${code}. ${err?.message || 'Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error('Email auth error:', err);
      const code = err?.code ? ` (${err.code})` : '';
      if (err?.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please sign in instead.');
      } else if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err?.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err?.code === 'auth/configuration-not-found' || err?.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled. Please use Google sign-in or contact support.');
      } else {
        setError(`Failed to ${isSignUp ? 'sign up' : 'sign in'}${code}. ${err?.message || 'Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 rounded-2xl p-8 z-50 shadow-2xl"
          >
            {/* Close Button - Hidden */}
            
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">
                Create your account
              </h2>
              <p className="text-gray-400 text-base leading-relaxed">
                Log in to unlock detailed portfolio insights, track your progress, and get hired faster.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {!showEmailForm ? (
                <>
                  {/* Google Sign In Button */}
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-gradient-to-b from-slate-900 to-slate-950 text-gray-400 uppercase tracking-wider font-semibold">Or continue with</span>
                    </div>
                  </div>

                  {/* Email Button */}
                  <button
                    onClick={() => setShowEmailForm(true)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-slate-800/50 hover:bg-slate-700/50 text-gray-200 font-semibold py-3 px-4 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mail className="w-5 h-5" />
                    Email Address
                  </button>
                </>
              ) : (
                <>
                  {/* Email/Password Form */}
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email address"
                          required
                          className="w-full bg-slate-800/30 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="relative">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password (min 6 characters)"
                          required
                          className="w-full bg-slate-800/30 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                      ) : (
                        isSignUp ? 'Sign Up' : 'Sign In'
                      )}
                    </button>
                  </form>

                  {/* Back Button */}
                  <button
                    onClick={() => {
                      setShowEmailForm(false);
                      setEmail('');
                      setPassword('');
                      setError('');
                      setIsSignUp(false);
                    }}
                    className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors py-2"
                  >
                    Back
                  </button>

                  {/* Toggle Sign In / Sign Up */}
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                      }}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <p className="mt-8 text-center text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Privacy Policy</a>.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
