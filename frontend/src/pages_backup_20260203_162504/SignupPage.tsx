// src/pages/SignupPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Shield, 
  X, 
  Loader2, 
  ChevronDown, 
  Eye, 
  EyeOff,
  Circle,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import AuthLayout from '../components/AuthLayout';

// ===== TYPES =====
interface Country {
  code: string;
  flag: string;
  name: string;
}

// ===== PHONE INPUT COMPONENT (SPLIT BUTTON LAYOUT) =====
interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryChange: (code: string) => void;
  onPhoneChange: (value: string) => void;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  countryCode,
  phoneNumber,
  onCountryChange,
  onPhoneChange,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const countries: Country[] = [
    { code: '+212', flag: '🇲🇦', name: 'Morocco' },
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
  ];

  const selectedCountry = countries.find(c => c.code === countryCode);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhoneInput = (value: string) => {
    // Allow only digits, max 15
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 15) {
      onPhoneChange(digits);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Phone Number
      </label>
      <div className="flex border border-slate-600 rounded-xl bg-slate-700 focus-within:border-purple-500 transition-colors">
        {/* Flag Button (100px) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-[100px] h-[48px] px-3 flex items-center justify-between border-r border-slate-600 hover:bg-slate-600 transition-colors rounded-l-xl"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-xl">{selectedCountry?.flag}</span>
              <span className="text-sm font-medium text-white">{selectedCountry?.code}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-full mt-1 left-0 w-[240px] bg-slate-700 border border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    onCountryChange(country.code);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 hover:bg-slate-600 transition-colors flex items-center gap-3 text-left"
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="text-sm text-white font-medium w-12">{country.code}</span>
                  <span className="text-sm text-slate-400">{country.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Number Input (Flex-1) */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => handlePhoneInput(e.target.value)}
          placeholder="612345678"
          className="flex-1 h-[48px] px-4 bg-transparent text-white placeholder-slate-400 focus:outline-none rounded-r-xl"
        />
      </div>
    </div>
  );
};

// ===== PASSWORD STRENGTH COMPONENT (SEGMENTED PROGRESS BAR) =====
interface PasswordStrengthProps {
  password: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  showStrength?: boolean;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  label,
  placeholder,
  value,
  onChange,
  showStrength = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Criteria validation
  const criteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const validCount = Object.values(criteria).filter(Boolean).length;

  // Determine color for each segment
  const getSegmentColor = (index: number): string => {
    if (validCount === 0) return 'bg-slate-600';
    if (validCount === 1) {
      return index === 0 ? 'bg-red-500' : 'bg-slate-600';
    }
    if (validCount === 2) {
      return index < 2 ? 'bg-yellow-500' : 'bg-slate-600';
    }
    if (validCount === 3) {
      return index < 3 ? 'bg-yellow-500' : 'bg-slate-600';
    }
    return 'bg-emerald-500'; // All 4 segments green
  };

  const getStrengthText = () => {
    if (validCount === 0) return '';
    if (validCount <= 2) return 'Weak';
    if (validCount === 3) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (validCount === 0) return '';
    if (validCount <= 2) return 'text-red-400';
    if (validCount === 3) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Segmented Progress Bar */}
      {showStrength && password && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">Password Strength</span>
            <span className={`font-semibold ${getStrengthColor()}`}>
              {getStrengthText()}
            </span>
          </div>

          {/* 4-Segment Bar */}
          <div className="flex gap-1 mb-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${getSegmentColor(index)}`}
              />
            ))}
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {[
              { key: 'length', text: 'At least 8 characters' },
              { key: 'upper', text: 'One uppercase letter (A-Z)' },
              { key: 'number', text: 'One number (0-9)' },
              { key: 'special', text: 'One special character (!@#$...)' },
            ].map((rule) => {
              const isValid = criteria[rule.key as keyof typeof criteria];
              return (
                <div key={rule.key} className="flex items-center gap-2 text-sm">
                  {isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  )}
                  <span className={isValid ? 'text-emerald-500' : 'text-slate-400'}>
                    {rule.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ===== MAIN SIGNUP PAGE =====
const SignupPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+212');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaVerifying, setCaptchaVerifying] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password validation
  const passwordCriteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);
  const isPhoneValid = phoneNumber.length >= 6 && phoneNumber.length <= 15;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Step 1: Send OTP
  const handleStep1 = () => {
    if (!fullName || !phoneNumber || !email) {
      error('Please fill in all fields');
      return;
    }
    if (!email.includes('@')) {
      error('Please enter a valid email address');
      return;
    }
    if (!isPhoneValid) {
      error('Please enter a valid phone number (6-15 digits)');
      return;
    }

    setLoading(true);
    const randomOTP = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(randomOTP);

    setTimeout(() => {
      setLoading(false);
      setOtpTimer(30);
      success(`SMS Sent: Your code is ${randomOTP}`);
      info(`Code expires in 30 seconds`);
      setStep(2);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }, 1000);
  };

  // OTP Input handling
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError(false);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleStep2 = () => {
    if (otp.some((digit) => !digit)) {
      error('Please enter the complete verification code');
      return;
    }
    if (otpTimer === 0) {
      error('Verification code has expired. Please resend.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const enteredCode = otp.join('');

      if (enteredCode === generatedOTP) {
        success('Code verified successfully!');
        setStep(3);
      } else {
        error(`Invalid code. Expected: ${generatedOTP}`);
        setOtpError(true);
        setTimeout(() => setOtpError(false), 600);
      }
    }, 1500);
  };

  // Resend OTP
  const handleResendOTP = () => {
    const randomOTP = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(randomOTP);
    setOtp(['', '', '', '', '', '']);
    setOtpTimer(30);
    success(`New code sent: ${randomOTP}`);
    otpRefs.current[0]?.focus();
  };

  // Captcha verification
  const handleCaptchaCheck = (checked: boolean) => {
    if (!checked) {
      setCaptchaChecked(false);
      setCaptchaVerified(false);
      return;
    }

    setCaptchaChecked(true);
    setCaptchaVerifying(true);

    setTimeout(() => {
      setCaptchaVerifying(false);
      setCaptchaVerified(true);
      success('Captcha verified!');
    }, 1500);
  };

  // Step 3: Create account
  const handleStep3 = () => {
    if (!password || !confirmPassword) {
      error('Please fill in all fields');
      return;
    }
    if (!isPasswordStrong) {
      error('Password must meet all security requirements');
      return;
    }
    if (!passwordsMatch) {
      error('Passwords do not match');
      return;
    }
    if (!captchaVerified) {
      error('Please complete the captcha verification');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      success('Account created successfully! Welcome!');
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <AuthLayout
      quote="Join thousands of companies securing their data"
      quoteAuthor="Start your journey to data excellence"
    >
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 mx-2 transition-all ${
                    step > s ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: User Information */}
        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
              <p className="text-slate-400 text-sm">Step 1 of 3: Your Information</p>
            </div>

            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Phone Input Component */}
              <PhoneInput
                countryCode={countryCode}
                phoneNumber={phoneNumber}
                onCountryChange={setCountryCode}
                onPhoneChange={setPhoneNumber}
              />

              {/* Work Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Work Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleStep1}
                disabled={loading || !isPhoneValid}
                className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Verify Your Phone</h2>
              <p className="text-slate-400 text-sm">Step 2 of 3: Enter Verification Code</p>
              <p className="text-slate-500 text-xs mt-2">
                Code sent to {countryCode} {phoneNumber}
              </p>
              {otpTimer > 0 ? (
                <p className="text-purple-400 text-sm mt-2 font-mono font-bold">
                  ⏱️ Expires in {otpTimer}s
                </p>
              ) : (
                <p className="text-red-400 text-sm mt-2 font-semibold">
                  ⚠️ Code expired! Resend required
                </p>
              )}
            </div>

            <div className="space-y-6">
              <div className={`flex justify-center gap-2 ${otpError ? 'animate-shake' : ''}`}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold bg-slate-700 border rounded-xl text-white focus:outline-none transition-all ${
                      otpError
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-600 focus:border-purple-500'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleResendOTP}
                disabled={otpTimer > 0}
                className="w-full text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {otpTimer > 0 ? `Resend in ${otpTimer}s` : '🔄 Resend code'}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleStep2}
                  disabled={loading || otpTimer === 0}
                  className="flex-1 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Secure Access */}
        {step === 3 && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Secure Your Account</h2>
              <p className="text-slate-400 text-sm">Step 3 of 3: Create Password</p>
            </div>

            <div className="space-y-6">
              {/* Password with Strength Meter */}
              <PasswordStrength
                password={password}
                label="Password"
                placeholder="Enter password"
                value={password}
                onChange={setPassword}
                showStrength={true}
              />

              {/* Confirm Password */}
              <div>
                <PasswordStrength
                  password={confirmPassword}
                  label="Confirm Password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  showStrength={false}
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && passwordsMatch && (
                  <p className="mt-2 text-sm text-emerald-500 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Smart Captcha */}
              <div className="p-4 bg-slate-700 border border-slate-600 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={captchaChecked}
                      onChange={(e) => handleCaptchaCheck(e.target.checked)}
                      disabled={captchaVerifying}
                      className="w-5 h-5 rounded border-slate-500 bg-slate-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    {captchaVerifying && (
                      <Loader2 className="absolute inset-0 w-5 h-5 text-purple-400 animate-spin" />
                    )}
                    {captchaVerified && (
                      <Check className="absolute inset-0 w-5 h-5 text-emerald-400 pointer-events-none" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Shield className={`w-5 h-5 transition-colors ${
                      captchaVerified ? 'text-emerald-400' :
                      captchaVerifying ? 'text-purple-400' :
                      'text-slate-400 group-hover:text-purple-400'
                    }`} />
                    <span className="text-slate-300 text-sm">
                      {captchaVerified ? 'Verified!' : 'I am not a robot'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleStep3}
                  disabled={loading || !isPasswordStrong || !passwordsMatch || !captchaVerified}
                  className="flex-1 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
            Sign In
          </Link>
        </div>
      </div>

      {/* Shake Animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.6s;
        }
      `}</style>
    </AuthLayout>
  );
};

export default SignupPage;
