// src/components/UserModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Mail, User, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import userService, { type User as UserType } from '../services/userService';

interface UserModalProps {
  user: UserType | null;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer',
    is_active: true,
    is_verified: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        is_verified: user.is_verified
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (user) {
        // Update existing user
        await userService.updateUser(user.id, formData);
      } else {
        // Create new user
        if (!formData.password) {
          setError('Password is required for new users');
          setLoading(false);
          return;
        }
        await userService.createUser(formData);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="john@company.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password {user && <span className="text-slate-500">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required={!user}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none z-10" />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value="viewer" className="bg-slate-800 text-white">Viewer - Read-only access</option>
                <option value="editor" className="bg-slate-800 text-white">Editor - Can modify data</option>
                <option value="admin" className="bg-slate-800 text-white">Admin - Full access</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                Active (user can log in)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.is_verified}
                onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                Verified (email confirmed)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Saving...' : user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
