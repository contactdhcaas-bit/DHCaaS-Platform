// src/components/AddUserModal.tsx
import React, { useState } from 'react';
import { X, UserPlus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'Viewer',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.fullName.trim()) {
        throw new Error('Full name is required');
      }
      if (!formData.email.trim()) {
        throw new Error('Email address is required');
      }
      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // TODO: Replace with actual API call
      // await createUser(formData);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);

      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          role: 'Viewer',
        });
        setSuccess(false);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative bg-[#131B2C] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Add New User</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Invite a new team member to the platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-[#1E293B] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          
          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 shadow-lg shadow-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3 shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 text-sm font-semibold">
                User created successfully!
              </p>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="e.g., John Doe"
              className="bg-[#0F172A] border border-[#1E293B] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white w-full p-2.5 rounded-lg text-sm placeholder-slate-500 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g., john@company.com"
              className="bg-[#0F172A] border border-[#1E293B] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white w-full p-2.5 rounded-lg text-sm placeholder-slate-500 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="bg-[#0F172A] border border-[#1E293B] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white w-full p-2.5 rounded-lg text-sm focus:outline-none transition-all"
            >
              <option value="Admin">Admin - Full system access</option>
              <option value="Editor">Editor - Can edit data</option>
              <option value="Viewer">Viewer - Read-only access</option>
            </select>
            <p className="text-slate-500 text-xs mt-1.5">
              Role determines user permissions and access level
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-transparent border border-[#1E293B] hover:border-[#2E3D4B] text-slate-400 hover:text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Created!
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
