'use client';

import { LogOut, User as UserIcon } from 'lucide-react';

interface NavBarProps {
  user: any;
  onLoginClick: () => void;
  onLogout: () => void;
}

export default function NavBar({ user, onLoginClick, onLogout }: NavBarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">UX Analyzer</span>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Mock Interview
            </a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pricing
            </a>
          </div>

          {/* Right: Auth Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-8 h-8 rounded-full border border-white/20" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <UserIcon size={16} />
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm text-gray-300">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={onLoginClick}
                  className="px-4 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-100 transition-colors"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
