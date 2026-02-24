// src/pages/ProfilePage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Building2, 
  MapPin, 
  Lock, 
  Calendar, 
  Shield, 
  CheckCircle2,
  Upload,
  X,
  Info,
  ArrowRight,
  Briefcase,
  Mail,
  Phone as PhoneIcon
} from 'lucide-react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data from localStorage
  const [formData, setFormData] = useState({
    fullName: localStorage.getItem('dhcaas_user_name') || 'Youssef Admin',
    jobTitle: localStorage.getItem('dhcaas_user_job') || 'Enterprise Plan',
    email: localStorage.getItem('dhcaas_user_email') || 'admin@dhcaas.com',
    phone: localStorage.getItem('dhcaas_user_phone') || '',
    company: localStorage.getItem('dhcaas_user_company') || '',
    department: localStorage.getItem('dhcaas_user_department') || '',
    location: localStorage.getItem('dhcaas_user_location') || '',
    avatar: localStorage.getItem('dhcaas_user_avatar') || '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string>(formData.avatar);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);

  const memberSince = localStorage.getItem('dhcaas_member_since') || 'January 2026';

  // Detect if form has changes
  useEffect(() => {
    const hasChanges = 
      formData.fullName !== localStorage.getItem('dhcaas_user_name') ||
      formData.jobTitle !== localStorage.getItem('dhcaas_user_job') ||
      formData.phone !== localStorage.getItem('dhcaas_user_phone') ||
      formData.company !== localStorage.getItem('dhcaas_user_company') ||
      formData.department !== localStorage.getItem('dhcaas_user_department') ||
      formData.location !== localStorage.getItem('dhcaas_user_location') ||
      avatarPreview !== formData.avatar;
    
    setIsDirty(hasChanges);
  }, [formData, avatarPreview]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
    // Basic validation - check if it starts with + and has at least 10 digits
    const isValid = /^\+\d{10,}$/.test(value.replace(/\s/g, ''));
    setPhoneValid(isValid || value === '');
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!phoneValid && formData.phone) {
      alert('Please enter a valid phone number');
      return;
    }

    setIsSaving(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Save to localStorage
    localStorage.setItem('dhcaas_user_name', formData.fullName);
    localStorage.setItem('dhcaas_user_job', formData.jobTitle);
    localStorage.setItem('dhcaas_user_phone', formData.phone);
    localStorage.setItem('dhcaas_user_company', formData.company);
    localStorage.setItem('dhcaas_user_department', formData.department);
    localStorage.setItem('dhcaas_user_location', formData.location);
    localStorage.setItem('dhcaas_user_avatar', avatarPreview);

    // Notify sidebar to update (Real-time sync)
    window.dispatchEvent(new Event('profileUpdated'));

    setIsSaving(false);
    setIsDirty(false);

    // Show success message
    alert('Profile updated successfully!');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-gray-400">Manage your account information and preferences</p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={[
              'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all',
              isDirty && !isSaving
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/30'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed',
            ].join(' ')}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Avatar & Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Avatar Card */}
            <div className="bg-[#0B1120] border border-gray-800 rounded-2xl p-6">
              <div className="flex flex-col items-center">
                {/* Avatar Display */}
                <div className="relative mb-4">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-3xl font-bold overflow-hidden border-4 border-gray-800 shadow-2xl">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={formData.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(formData.fullName)}</span>
                    )}
                  </div>
                  
                  {avatarPreview && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute top-0 right-0 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                      title="Remove avatar"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {/* Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>
                
                <p className="text-xs text-gray-500 mt-2">Max size: 2MB</p>
              </div>
            </div>

            {/* Member Info Card */}
            <div className="bg-[#0B1120] border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Member Since</div>
                  <div className="text-white font-semibold">{memberSince}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Plan</div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">Enterprise</span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full font-medium">
                      Premium
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white font-semibold">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Forms */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Information Card */}
            <div className="bg-[#0B1120] border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                    placeholder="e.g., Data Engineer"
                  />
                </div>

                {/* Email (Read-only with Lock) */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full pl-12 pr-12 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-gray-300 cursor-not-allowed ring-1 ring-purple-500/20"
                    />
                    <button
                      onMouseEnter={() => setShowEmailTooltip(true)}
                      onMouseLeave={() => setShowEmailTooltip(false)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <Info className="w-4 h-4 text-gray-500 hover:text-gray-400 transition-colors" />
                    </button>

                    {/* Tooltip */}
                    {showEmailTooltip && (
                      <div className="absolute z-10 right-0 top-full mt-2 w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl text-xs text-gray-300">
                        <div className="font-semibold text-white mb-1">Email is locked</div>
                        Email is managed by your workspace admin. Contact support to change.
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Verified</span>
                  </div>
                </div>

                {/* Phone (International) */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <div className="phone-input-wrapper">
                    <PhoneInput
                      defaultCountry="ma"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className={[
                        'w-full',
                        !phoneValid && formData.phone ? 'phone-input-error' : '',
                      ].join(' ')}
                      inputClassName="phone-input-field"
                      countrySelectorStyleProps={{
                        buttonClassName: 'phone-country-button',
                      }}
                    />
                  </div>
                  {!phoneValid && formData.phone && (
                    <p className="text-xs text-red-400 mt-1.5">Please enter a valid phone number</p>
                  )}
                  {phoneValid && formData.phone && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">Valid number</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Information Card */}
            <div className="bg-[#0B1120] border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Company Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                    placeholder="e.g., DataGuard AI"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                    placeholder="e.g., Engineering"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                    placeholder="e.g., Casablanca, Morocco"
                  />
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-[#0B1120] border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Security Settings</h2>
                  <p className="text-sm text-gray-400">Manage your password and two-factor authentication</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/settings?tab=security')}
                className="flex items-center justify-between w-full px-6 py-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  <div className="text-left">
                    <div className="text-white font-semibold">Manage Password & 2FA</div>
                    <div className="text-xs text-gray-500">Update your security preferences in Settings</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Phone Input */}
      <style>{`
        .phone-input-wrapper .react-international-phone-input-container {
          background: #0A0F1E;
          border: 1px solid #374151;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }

        .phone-input-wrapper .react-international-phone-input-container:focus-within {
          border-color: #9333ea;
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
        }

        .phone-input-wrapper .react-international-phone-input {
          background: transparent;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
        }

        .phone-input-wrapper .react-international-phone-country-selector-button {
          background: transparent;
          border: none;
          padding: 0.75rem;
          border-right: 1px solid #374151;
        }

        .phone-input-wrapper .react-international-phone-country-selector-button:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown {
          background: #0B1120;
          border: 1px solid #374151;
          border-radius: 0.75rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          max-height: 300px;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item {
          color: white;
          padding: 0.5rem 1rem;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item:hover {
          background: rgba(147, 51, 234, 0.2);
        }

        .phone-input-error .react-international-phone-input-container {
          border-color: #ef4444 !important;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
