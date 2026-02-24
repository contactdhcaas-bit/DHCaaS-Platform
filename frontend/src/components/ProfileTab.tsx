import React from "react";
import {
  User,
  Shield,
  Star,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Save,
  Loader2,
} from "lucide-react";
import { useProfile } from "../hooks/useProfile";

// Skeleton Component
const SkeletonLine: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const ProfileTab: React.FC = () => {
  const {
    profile,
    isLoading,
    error,
    isSaving,
    hasChanges,
    updateProfile,
    saveProfile,
    discardChanges,
    retry,
  } = useProfile();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <User className="w-6 h-6 text-indigo-500" />
            My Profile
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal information and organization details
          </p>
        </div>
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-indigo-50 shadow-lg">
          {(profile.email?.charAt(0) || profile.name?.charAt(0) || "U").toUpperCase()}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <SkeletonLine className="h-4 w-24" />
                <SkeletonLine className="h-11 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Profile</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Profile Form */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                value={profile.name || ""}
                onChange={(e) => updateProfile({ name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Job Title</label>
              <input
                type="text"
                value={profile.job_title || ""}
                onChange={(e) => updateProfile({ job_title: e.target.value })}
                placeholder="e.g., Data Protection Officer"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <input
                disabled
                value={profile.email}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Organization</label>
              <input
                disabled
                value={profile.organization}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Timezone</label>
              <select
                value={profile.timezone}
                onChange={(e) => updateProfile({ timezone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="UTC">UTC (GMT+0)</option>
                <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                <option value="America/New_York">America/New York (GMT-5)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Language</label>
              <select
                value={profile.language}
                onChange={(e) => updateProfile({ language: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Role</label>
              <div className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                {profile.role}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Plan Status</label>
              <div className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Enterprise (Active)
              </div>
            </div>
          </div>

          {/* Dirty State Action Bar */}
          {hasChanges && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">You have unsaved changes</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={discardChanges}
                  disabled={isSaving}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={isSaving}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProfileTab;
