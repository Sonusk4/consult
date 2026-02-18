
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { ArrowRight, Mail, Shield, ChevronLeft, Info } from 'lucide-react';
import { auth } from '../services/api';

type AuthStep = 'ROLE' | 'EMAIL' | 'OTP' | 'PASSWORD';

interface AuthPageProps {
  type: 'LOGIN' | 'SIGNUP';
}

const AuthPage: React.FC<AuthPageProps> = ({ type }) => {
  const [step, setStep] = useState<AuthStep>(type === 'LOGIN' ? 'EMAIL' : 'ROLE');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.USER);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Reset step if type changes
  React.useEffect(() => {
    setStep(type === 'LOGIN' ? 'EMAIL' : 'ROLE');
    setError('');
  }, [type]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('EMAIL');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Send OTP via API
      await auth.sendOtp(email);
      setStep('OTP');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.some(digit => digit === '')) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setError('');
    setIsLoading(true);

    const otpString = otp.join('');

    try {
      // Verify OTP
      await auth.verifyOtp(email, otpString);

      // If verification successful, login (create/update user)
      // Only send role if SIGNUP. If LOGIN, send undefined to preserve existing role.
      const user = await login(email, type === 'SIGNUP' ? selectedRole : undefined);

      // Redirect based on ACTUAL role from backend
      if (user.role === UserRole.USER) navigate('/user/dashboard');
      else if (user.role === UserRole.CONSULTANT || user.role === UserRole.ENTERPRISE_ADMIN) navigate('/consultant/dashboard');
      else navigate('/');

    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP or Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOtp = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    // Auto-focus next
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const stepPercentage = {
    'ROLE': 33,
    'EMAIL': type === 'LOGIN' ? 50 : 66,
    'OTP': 100,
    'PASSWORD': 100
  }[step];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 transition-all duration-500">

        {/* Progress Header */}
        <div className="bg-blue-600 px-8 py-10 text-white relative">
          <div className="absolute top-0 left-0 h-1.5 bg-blue-400 transition-all duration-700" style={{ width: `${stepPercentage}%` }}></div>
          <h2 className="text-3xl font-black mb-1">ConsultaPro</h2>
          <p className="text-blue-100 font-medium text-sm">
            {type === 'LOGIN' ? "Welcome back!" : "Join our global community"}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl animate-bounce">
              {error}
            </div>
          )}

          {step === 'ROLE' ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Choose your path</h3>
              <RoleButton
                title="Client / User"
                subtitle="I want to find and book consultants"
                onClick={() => handleRoleSelect(UserRole.USER)}
              />
              <RoleButton
                title="Individual Expert"
                subtitle="I want to offer my expertise directly"
                onClick={() => handleRoleSelect(UserRole.CONSULTANT)}
              />
              <RoleButton
                title="Enterprise Partner"
                subtitle="Managing teams and large-scale operations"
                onClick={() => handleRoleSelect(UserRole.ENTERPRISE_ADMIN)}
              />

              <div className="pt-4 text-center">
                <p className="text-sm text-gray-500">Already have an account? <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline">Login here</button></p>
              </div>
            </div>
          ) : step === 'EMAIL' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {type === 'SIGNUP' && <BackButton onClick={() => setStep('ROLE')} />}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{type === 'LOGIN' ? 'Login' : 'Registration'}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Enter your professional email to receive a verification code.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center group disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : <>Send Verification Code <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} /></>}
                </button>
              </div>

              {type === 'LOGIN' && (
                <div className="pt-2 text-center">
                  <p className="text-sm text-gray-500">New here? <button type="button" onClick={() => navigate('/signup')} className="text-blue-600 font-bold hover:underline">Create an account</button></p>
                </div>
              )}
            </form>
          ) : step === 'OTP' ? (
            <div className="space-y-6">
              <BackButton onClick={() => setStep('EMAIL')} />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Verify it's you</h3>
                <p className="text-gray-500 text-sm">We've sent a 6-digit code to <span className="text-gray-900 font-bold">{email}</span></p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      className="w-full h-14 text-center text-2xl font-black border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:outline-none focus:bg-blue-50 transition-all"
                      value={digit}
                      onChange={(e) => updateOtp(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0) {
                          document.getElementById(`otp-${i - 1}`)?.focus();
                        }
                      }}
                      disabled={isLoading}
                    />
                  ))}
                </div>
                <button
                  onClick={handleOtpSubmit}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">Didn't receive code? <button type="button" onClick={handleEmailSubmit} className="text-blue-600 font-bold hover:underline">Resend OTP</button></p>
              </div>
            </div>
          ) : null}

          <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center space-x-2 text-gray-400">
            <Shield size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted Access</span>
          </div>
        </div>
      </div>

      {/* Demo Helper Box */}
      <div className="mt-8 max-w-md w-full bg-blue-50/50 backdrop-blur border border-blue-100 rounded-2xl p-4 flex items-start space-x-3">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
          <Info size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">Testing Information</h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            Backend Integration Active.
            <br />• Enter a valid email found in backend (or any new email to register).
            <br />• Check backend logs for OTP if email sending fails locally.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const RoleButton = ({ title, subtitle, onClick }: { title: string, subtitle: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
  >
    <div className="text-left">
      <p className="font-bold text-gray-900 group-hover:text-blue-900">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
    <ArrowRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
  </button>
);

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="text-gray-400 font-bold text-sm hover:text-blue-600 flex items-center mb-6 transition-colors">
    <ChevronLeft size={16} className="mr-1" /> Back
  </button>
);

export default AuthPage;
