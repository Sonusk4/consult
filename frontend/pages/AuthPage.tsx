import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { UserRole } from "../types";
import { ArrowRight, Mail, Shield, ChevronLeft, Info } from "lucide-react";
import { auth } from "../services/api";

type AuthStep = "ROLE" | "EMAIL" | "OTP" | "PASSWORD" | "MEMBER_LOGIN";

interface AuthPageProps {
  type: "LOGIN" | "SIGNUP";
}

const AuthPage: React.FC<AuthPageProps> = ({ type }) => {
  const [step, setStep] = useState<AuthStep>(
    type === "LOGIN" ? "ROLE" : "ROLE"
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.USER);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Reset step if type changes
  React.useEffect(() => {
    setStep("ROLE");
    setError("");
  }, [type]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    
    // Team members can only login with username/password
    if (role === UserRole.ENTERPRISE_MEMBER) {
      if (type === "SIGNUP") {
        setError("Enterprise team members cannot sign up independently. Please request an invitation from your enterprise administrator.");
        setShowLoginRedirect(true);
        return;
      }
      setStep("MEMBER_LOGIN");
    } else {
      setStep("EMAIL");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      console.log("📧 Sending OTP to:", email, "Type:", type);
      // Send OTP via API
      const response = await auth.sendOtp(email, type);
      console.log("✅ OTP send response:", response);
      setStep("OTP");
    } catch (err: any) {
      console.error("❌ OTP send error:", err);
      const message =
        err.response?.data?.error || "Failed to send OTP. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter your username and password");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      console.log("Logging in team member:", username);
      const loginRes = await auth.loginMember(username, password);

      if (!loginRes.customToken) {
        throw new Error("No token received from server");
      }

      console.log("Team member login successful");

      // Check if in dev mode
      if (loginRes.devMode) {
        console.log("Dev mode detected - storing JWT token");
        localStorage.setItem("devToken", loginRes.customToken);
      } else {
        // Production: Sign in with Firebase custom token
        console.log("Production mode - signing in with Firebase");
        const { signInWithCustomToken } = await import("firebase/auth");
        const { auth: firebaseAuth } = await import("../src/services/firebase");
        await signInWithCustomToken(firebaseAuth, loginRes.customToken);
      }

      // Store user data
      if (loginRes.user) {
        localStorage.setItem("user", JSON.stringify(loginRes.user));
      }

      // Call login to sync with backend
      const user = await login(loginRes.user?.email);

      console.log("Team member synced successfully:", user);

      // Redirect to member dashboard
      navigate("/member/dashboard");
    } catch (err: any) {
      console.error("Team member login failed:", err);
      const message =
        err.response?.data?.error ||
        err.message ||
        "Invalid username or password";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.some((digit) => digit === "")) {
      setError("Please enter the full 6-digit code");
      return;
    }
    setError("");
    setIsLoading(true);

    const otpString = otp.map(d => d.trim()).join("");

    try {
      // Step 1: Verify OTP with backend
      console.log("Verifying OTP for:", email);
      console.log("OTP String:", otpString);
      const verifyRes = await auth.verifyOtp(email, otpString);

      if (!verifyRes.customToken) {
        throw new Error("No custom token received from server");
      }

      console.log("OTP verified, token received");

      // Check if in dev mode (Firebase not initialized)
      if (verifyRes.devMode) {
        console.log("Dev mode detected - storing JWT token");
        // Store dev JWT token for API requests
        localStorage.setItem("devToken", verifyRes.customToken);
      } else {
        // Step 2: Sign in with Firebase using custom token (production mode)
        console.log("Production mode - signing in with Firebase custom token");
        const { signInWithCustomToken } = await import("firebase/auth");
        const { auth: firebaseAuth } = await import("../src/services/firebase");

        const userCredential = await signInWithCustomToken(
          firebaseAuth,
          verifyRes.customToken
        );
        console.log("Firebase sign in successful:", userCredential.user.uid);
      }

      // Step 3: Sync user with backend
      console.log("Syncing user with backend...");
      const user = await login(
        email,
        type === "SIGNUP" ? selectedRole : undefined,
        type === "SIGNUP" ? fullName : undefined
      );

      console.log("User synced successfully:", user);

      // Step 4: Redirect based on user role
      if (user.role === "USER") {
        navigate("/user/dashboard");
      } else if (user.role === "CONSULTANT") {
        navigate("/consultant/dashboard");
      } else if (user.role === "ENTERPRISE_ADMIN") {
        navigate("/enterprise/dashboard");
      } else if (user.role === "ENTERPRISE_MEMBER") {
        navigate("/member/dashboard");
      } else if (user.role === "PLATFORM_ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("OTP verification failed:", err);

      // Handle specific error messages
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Invalid OTP or Login failed.";

      if (errorMessage.includes("expired")) {
        setError("OTP has expired. Please request a new one.");
      } else if (errorMessage.includes("Invalid")) {
        setError("Invalid OTP. Please check and try again.");
      } else {
        setError(errorMessage);
      }
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
    if (value !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const stepPercentage = {
    ROLE: 33,
    EMAIL: type === "LOGIN" ? 50 : 66,
    OTP: 100,
    PASSWORD: 100,
    MEMBER_LOGIN: 50,
  }[step];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 transition-all duration-500">
        {/* Progress Header */}
        <div className="bg-blue-600 px-8 py-10 text-white relative">
          <div
            className="absolute top-0 left-0 h-1.5 bg-blue-400 transition-all duration-700"
            style={{ width: `${stepPercentage}%` }}
          ></div>
          <h2 className="text-3xl font-black mb-1">ConsultaPro</h2>
          <p className="text-blue-100 font-medium text-sm">
            {type === "LOGIN" ? "Welcome back!" : "Join our global community"}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 space-y-3">
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl">
                {error}
              </div>

              {showLoginRedirect && (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Go to Login
                </button>
              )}
            </div>
          )}

          {step === "ROLE" ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                {type === "LOGIN" ? "Login as" : "Choose your path"}
              </h3>
              <RoleButton
                title="Client / User"
                subtitle={type === "LOGIN" ? "I am a client" : "I want to find and book consultants"}
                onClick={() => handleRoleSelect(UserRole.USER)}
              />
              <RoleButton
                title="Individual Expert"
                subtitle={type === "LOGIN" ? "I am a consultant" : "I want to offer my expertise directly"}
                onClick={() => handleRoleSelect(UserRole.CONSULTANT)}
              />
              <RoleButton
                title="Enterprise Admin"
                subtitle={type === "LOGIN" ? "I manage teams" : "Managing teams and large-scale operations"}
                onClick={() => handleRoleSelect(UserRole.ENTERPRISE_ADMIN)}
              />

              {type === "LOGIN" && (
                <RoleButton
                  title="Enterprise Team Member"
                  subtitle="I am part of an enterprise team"
                  onClick={() => handleRoleSelect(UserRole.ENTERPRISE_MEMBER)}
                />
              )}

              <div className="pt-4 text-center">
                <p className="text-sm text-gray-500">
                  {type === "LOGIN" ? "New here? " : "Already have an account? "}
                  <button
                    onClick={() => navigate(type === "LOGIN" ? "/signup" : "/login")}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    {type === "LOGIN" ? "Sign up here" : "Login here"}
                  </button>
                </p>
              </div>
            </div>
          ) : step === "EMAIL" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {type === "SIGNUP" && (
                <BackButton onClick={() => { setStep("ROLE"); setError(""); }} />
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {type === "LOGIN" ? "Login" : "Registration"}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Enter your professional email to receive a verification code.
                </p>
              </div>

              <div className="space-y-4">
                {type === "SIGNUP" && (
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required={type === "SIGNUP"}
                      placeholder="Enter your full name"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-4 pr-4 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
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
                  {isLoading ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Verification Code{" "}
                      <ArrowRight
                        className="ml-2 group-hover:translate-x-1 transition-transform"
                        size={20}
                      />
                    </>
                  )}
                </button>
              </div>

              {type === "LOGIN" && (
                <div className="pt-2 text-center">
                  <p className="text-sm text-gray-500">
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/signup")}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Create an account
                    </button>
                  </p>
                </div>
              )}
            </form>
          ) : step === "OTP" ? (
            <div className="space-y-6">
              <BackButton onClick={() => setStep("EMAIL")} />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Verify it's you
                </h3>
                <p className="text-gray-500 text-sm">
                  We've sent a 6-digit code to{" "}
                  <span className="text-gray-900 font-bold">{email}</span>
                </p>
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
                        if (e.key === "Backspace" && !otp[i] && i > 0) {
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
                <p className="text-sm text-gray-500">
                  Didn't receive code?{" "}
                  <button
                    type="button"
                    onClick={handleEmailSubmit}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Resend OTP
                  </button>
                </p>
              </div>
            </div>
          ) : step === "MEMBER_LOGIN" ? (
            <form onSubmit={handleMemberLogin} className="space-y-6">
              <BackButton onClick={() => { setStep("ROLE"); setError(""); }} />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Team Member Login
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Enter your username and password provided by your enterprise administrator.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your username"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-4 pr-4 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-4 pr-4 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center group disabled:opacity-50"
                >
                  {isLoading ? (
                    "Logging in..."
                  ) : (
                    <>
                      Login{" "}
                      <ArrowRight
                        className="ml-2 group-hover:translate-x-1 transition-transform"
                        size={20}
                      />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : null}

          <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center space-x-2 text-gray-400">
            <Shield size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              End-to-End Encrypted Access
            </span>
          </div>
        </div>
      </div>

      {/* Demo Helper Box */}
      <div className="mt-8 max-w-md w-full bg-blue-50/50 backdrop-blur border border-blue-100 rounded-2xl p-4 flex items-start space-x-3">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
          <Info size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">
            Testing Information
          </h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            Backend Integration Active.
            <br />• Enter a valid email found in backend (or any new email to
            register).
            <br />• Check backend logs for OTP if email sending fails locally.
            <br />• Team members use the credentials provided by their admin.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const RoleButton = ({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
  >
    <div className="text-left">
      <p className="font-bold text-gray-900 group-hover:text-blue-900">
        {title}
      </p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
    <ArrowRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
  </button>
);

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="text-gray-400 font-bold text-sm hover:text-blue-600 flex items-center mb-6 transition-colors"
  >
    <ChevronLeft size={16} className="mr-1" /> Back
  </button>
);

export default AuthPage;