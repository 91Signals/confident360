'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileData {
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
}

interface EditableProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ProfileData) => void;
  resumeData?: ProfileData;
  portfolioUrl?: string;
  isLoading?: boolean;
}

export default function EditableProfileModal({
  isOpen,
  onClose,
  onConfirm,
  resumeData,
  portfolioUrl,
  isLoading = false,
}: EditableProfileModalProps) {
  const [formData, setFormData] = useState<ProfileData>({
    name: resumeData?.name || '',
    email: resumeData?.email || '',
    phone: resumeData?.phone || '',
    linkedin_url: resumeData?.linkedin_url || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (resumeData) {
      setFormData({
        name: resumeData.name || '',
        email: resumeData.email || '',
        phone: resumeData.phone || '',
        linkedin_url: resumeData.linkedin_url || '',
      });
    }
  }, [resumeData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      onConfirm(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error confirming profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-[#111]">
              <h2 className="text-xl font-semibold text-white">
                {isLoading ? 'Extracting Profile...' : 'Review Your Profile'}
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
                  <p className="text-gray-400">Extracting information from your resume...</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      placeholder="e.g., John Doe"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      placeholder="e.g., john@example.com"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      placeholder="e.g., +1 (555) 123-4567"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      name="linkedin_url"
                      value={formData.linkedin_url || ''}
                      onChange={handleChange}
                      placeholder="e.g., https://linkedin.com/in/johndoe"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  {portfolioUrl && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Portfolio URL</p>
                      <p className="text-sm text-indigo-300 truncate">{portfolioUrl}</p>
                    </div>
                  )}

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-xs text-gray-400">
                      💡 Tip: Please review and edit the extracted information if needed. You can correct any details before proceeding with the analysis.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!isLoading && (
              <div className="border-t border-white/10 p-6 flex gap-3 sticky bottom-0 bg-[#111]">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 size={16} />
                      Saved!
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
