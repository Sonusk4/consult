import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { UserRole } from "../types";
import { ArrowRight, Mail, Shield, ChevronLeft, Info, Eye, EyeOff } from "lucide-react";
import { auth } from "../services/api";

type AuthStep = "ROLE" | "EMAIL" | "OTP" | "PASSWORD" | "SIGNUP_PASSWORD" | "FORGOT_PASSWORD" | "RESET_PASSWORD";

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
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);
  const [signupEmail, setSignupEmail] = useState(""); // Email that needs OTP verification
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false); // First-time password change
  const [changedPassword, setChangedPassword] = useState("");
  const [changedConfirmPassword, setChangedConfirmPassword] = useState("");
  const [showChangedPassword, setShowChangedPassword] = useState(false);
  const [showChangedConfirmPassword, setShowChangedConfirmPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Password validation
  const validatePassword = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*]/.test(pwd);
    
    return {
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    };
  };

  const handleSignupWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError("Password must contain: 8+ characters, uppercase, lowercase, number, and special character (!@#$%^&*)");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      console.log("Signing up with password:", email);
      
      const signupRes = await auth.signupWithPassword({
        email,
        fullName,
        phone,
        password,
        role: selectedRole,
      });

      console.log("Signup response:", signupRes);

      // Check if OTP verification is required
      if (signupRes.requiresOtp) {
        console.log("OTP verification required, showing OTP step");
        setSignupEmail(email);
        setEmail(""); // Clear email for OTP form
        setOtp(["", "", "", "", "", ""]);
        setError("");
        setStep("OTP");
        setIsLoading(false);
        return;
      }

      if (!signupRes.customToken) {
        throw new Error("No custom token received from server");
      }

      console.log("Signup successful, token received");

      if (signupRes.devMode) {
        console.log("Dev mode detected - storing JWT token");
        localStorage.setItem("devToken", signupRes.customToken);
      } else {
        console.log("Production mode - signing in with Firebase");
        const { signInWithCustomToken } = await import("firebase/auth");
        const { auth: firebaseAuth } = await import("../src/services/firebase");
        await signInWithCustomToken(firebaseAuth, signupRes.customToken);
      }

      if (signupRes.user) {
        localStorage.setItem("user", JSON.stringify(signupRes.user));
      }

      const user = await login(signupRes.user?.email || email, selectedRole, fullName);
      console.log("User synced successfully:", user);

      if (user.role === "USER") {
        navigate("/user/dashboard");
      } else if (user.role === "CONSULTANT") {
        navigate("/consultant/dashboard");
      } else if (user.role === "ENTERPRISE_ADMIN") {
        navigate("/enterprise/dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Signup failed:", err);
      const message = err.response?.data?.error || err.message || "Signup failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      console.log("Logging in with password:", email);
      
      const loginRes = await auth.loginWithPassword(email, password);

      // Check if first-time password change is required
      if (loginRes.requiresPasswordChange) {
        console.log("First-time password change required");
        setShowPasswordChangeModal(true);
        setIsLoading(false);
        return;
      }

      if (!loginRes.customToken) {
        throw new Error("No token received from server");
      }

      console.log("Password login successful");

      if (loginRes.devMode) {
        console.log("Dev mode detected - storing JWT token");
        localStorage.setItem("devToken", loginRes.customToken);
      } else {
        console.log("Production mode - signing in with Firebase");
        const { signInWithCustomToken } = await import("firebase/auth");
        const { auth: firebaseAuth } = await import("../src/services/firebase");
        await signInWithCustomToken(firebaseAuth, loginRes.customToken);
      }

      if (loginRes.user) {
        localStorage.setItem("user", JSON.stringify(loginRes.user));
      }

      const user = await login(loginRes.user?.email);
      console.log("User synced successfully:", user);

      if (user.role === "USER") {
        navigate("/user/dashboard");
      } else if (user.role === "CONSULTANT") {
        navigate("/consultant/dashboard");
      } else if (user.role === "ENTERPRISE_ADMIN") {
        navigate("/enterprise/dashboard");
      } else if (user.role === "ENTERPRISE_MEMBER") {
        navigate("/member/dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Password login failed:", err);
      const message = err.response?.data?.error || err.message || "Invalid email or password";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      setError("Please enter your email");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      console.log("Sending reset password email:", resetEmail);
      
      await auth.forgotPassword(resetEmail);

      // In a real app, user would receive email with reset link
      // For now, we show a success message
      setError(""); // Clear error
      alert("If an account exists with this email, you will receive password reset instructions.");
      setStep("ROLE");
      setResetEmail("");
    } catch (err: any) {
      console.error("Forgot password failed:", err);
      const message = err.response?.data?.error || err.message || "Failed to send reset email";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetToken || !newPassword) {
      setError("Please enter reset token and new password");
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setError("Password must contain: 8+ characters, uppercase, lowercase, number, and special character");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      console.log("Resetting password with token");
      
      const resetRes = await auth.resetPassword(resetToken, newPassword);

      if (!resetRes.customToken) {
        throw new Error("No token received from server");
      }

      console.log("Password reset successful");

      if (resetRes.devMode) {
        localStorage.setItem("devToken", resetRes.customToken);
      } else {
        const { signInWithCustomToken } = await import("firebase/auth");
        const { auth: firebaseAuth } = await import("../src/services/firebase");
        await signInWithCustomToken(firebaseAuth, resetRes.customToken);
      }

      if (resetRes.user) {
        localStorage.setItem("user", JSON.stringify(resetRes.user));
      }

      const user = await login(resetRes.user?.email);
      navigate("/user/dashboard");
    } catch (err: any) {
      console.error("Password reset failed:", err);
      const message = err.response?.data?.error || err.message || "Password reset failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePasswordFirstLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!changedPassword || !changedConfirmPassword) {
      setError("Please enter your new password");
      return;
    }

    if (changedPassword !== changedConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordValidation = validatePassword(changedPassword);
    if (!passwordValidation.isValid) {
      setError("Password must contain: 8+ characters, uppercase, lowercase, number, and special character");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      console.log("Setting new password on first login");
      
      const changeRes = await auth.changePasswordFirstLogin(changedPassword);

      if (!changeRes.customToken) {
        throw new Error("No token received from server");
      }

      console.log("Password changed successfully");

      if (changeRes.devMode) {
        localStorage.setItem("devToken", changeRes.customToken);
      } else {
        const { signInWithCustomToken } = await import("firebase/auth");
        const { auth: firebaseAuth } = await import("../src/services/firebase");
        await signInWithCustomToken(firebaseAuth, changeRes.customToken);
      }

      if (changeRes.user) {
        localStorage.setItem("user", JSON.stringify(changeRes.user));
      }

      const user = await login(changeRes.user?.email);
      console.log("User synced successfully:", user);

      // Close modal and navigate based on role
      setShowPasswordChangeModal(false);
      setChangedPassword("");
      setChangedConfirmPassword("");
      
      if (user.role === "USER") {
        navigate("/user/dashboard");
      } else if (user.role === "CONSULTANT") {
        navigate("/consultant/dashboard");
      } else if (user.role === "ENTERPRISE_ADMIN") {
        navigate("/enterprise/dashboard");
      } else if (user.role === "ENTERPRISE_MEMBER") {
        navigate("/member/dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Password change failed:", err);
      const message = err.response?.data?.error || err.message || "Failed to change password";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset step if type changes
  React.useEffect(() => {
    setStep("ROLE");
    setError("");
  }, [type]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    
    // No separate login for enterprise members - they use email+password like everyone else
    setStep("EMAIL");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use signupEmail if in signup flow, otherwise use email from login flow
    const emailToUse = signupEmail || email;
    
    if (!emailToUse.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      console.log("📧 Sending OTP to:", emailToUse, "Type:", type);
      // Send OTP via API
      const response = await auth.sendOtp(emailToUse, type);
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

  const handleOtpSubmit = async () => {
    if (otp.some((digit) => digit === "")) {
      setError("Please enter the full 6-digit code");
      return;
    }
    setError("");
    setIsLoading(true);

    const otpString = otp.map(d => d.trim()).join("");
    
    // Determine which email to use: signupEmail (from signup flow) or email (from login flow)
    const emailToVerify = signupEmail || email;
    
    if (!emailToVerify) {
      setError("Email information missing. Please start over.");
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Verify OTP with backend
      console.log("Verifying OTP for:", emailToVerify);
      console.log("OTP String:", otpString);
      console.log("Signup flow:", !!signupEmail);
      const verifyRes = await auth.verifyOtp(emailToVerify, otpString);

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
      
      // For signup flow (via OTP), include role and fullName
      // For login flow, don't include them
      const isSignupFlow = !!signupEmail;
      const user = await login(
        emailToVerify,
        isSignupFlow ? selectedRole : undefined,
        isSignupFlow ? fullName : undefined
      );

      console.log("User synced successfully:", user);
      
      // Clear signup state if we were in signup flow
      if (isSignupFlow) {
        setSignupEmail("");
      }

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
            <form onSubmit={type === "SIGNUP" ? handleSignupWithPassword : handlePasswordLogin} className="space-y-6">
              {type === "SIGNUP" && (
                <BackButton onClick={() => { setStep("ROLE"); setError(""); }} />
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {type === "LOGIN" ? "Login" : "Registration"}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {type === "LOGIN" ? "Enter your email and password to login." : "Enter your details to create an account."}
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

                {type === "SIGNUP" && (
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required={type === "SIGNUP"}
                      placeholder="+1 (555) 123-4567"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-4 pr-4 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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

                {type === "SIGNUP" && (
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Create Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required={type === "SIGNUP"}
                        placeholder="Enter a strong password"
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-4 pr-12 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm">
                        <p className="text-xs font-bold text-gray-600 mb-2">Password Requirements:</p>
                        <div className="space-y-1 text-xs">
                          <p className={validatePassword(password).hasMinLength ? "text-green-600" : "text-red-600"}>
                            ✓ At least 8 characters
                          </p>
                          <p className={validatePassword(password).hasUpperCase ? "text-green-600" : "text-red-600"}>
                            ✓ One uppercase letter
                          </p>
                          <p className={validatePassword(password).hasLowerCase ? "text-green-600" : "text-red-600"}>
                            ✓ One lowercase letter
                          </p>
                          <p className={validatePassword(password).hasNumber ? "text-green-600" : "text-red-600"}>
                            ✓ One number
                          </p>
                          <p className={validatePassword(password).hasSpecialChar ? "text-green-600" : "text-red-600"}>
                            ✓ One special character (!@#$%^&*)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {type === "SIGNUP" && (
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required={type === "SIGNUP"}
                        placeholder="Re-enter your password"
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-4 pr-12 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 font-medium">Passwords do not match</p>
                    )}
                  </div>
                )}

                {type === "LOGIN" && (
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required={type === "LOGIN"}
                        placeholder="Enter your password"
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-4 pr-12 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center group disabled:opacity-50"
                >
                  {isLoading ? (
                    type === "SIGNUP" ? "Creating Account..." : "Logging in..."
                  ) : (
                    <>
                      {type === "SIGNUP" ? "Create Account" : "Login"}{" "}
                      <ArrowRight
                        className="ml-2 group-hover:translate-x-1 transition-transform"
                        size={20}
                      />
                    </>
                  )}
                </button>
              </div>

              {type === "LOGIN" && (
                <div className="space-y-3">
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => { setStep("FORGOT_PASSWORD"); setError(""); setResetEmail(email); }}
                      className="text-sm text-blue-600 font-bold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="pt-2 text-center border-t border-gray-100">
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
                </div>
              )}

              {type === "SIGNUP" && (
                <div className="pt-2 text-center">
                  <p className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Login here
                    </button>
                  </p>
                </div>
              )}
            </form>
          ) : step === "OTP" ? (
            <div className="space-y-6">
              <BackButton onClick={() => {
                // If in signup flow, restore the email that was cleared
                if (signupEmail) {
                  setEmail(signupEmail);
                  setSignupEmail("");
                }
                setStep("EMAIL");
                setError("");
              }} />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Verify it's you
                </h3>
                <p className="text-gray-500 text-sm">
                  We've sent a 6-digit code to{" "}
                  <span className="text-gray-900 font-bold">{signupEmail || email}</span>
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
          ) : step === "FORGOT_PASSWORD" ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <BackButton onClick={() => { setStep("EMAIL"); setError(""); setResetEmail(""); }} />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Reset Your Password
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <div className="space-y-4">
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
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
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
                      Send Reset Link{" "}
                      <ArrowRight
                        className="ml-2 group-hover:translate-x-1 transition-transform"
                        size={20}
                      />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : step === "RESET_PASSWORD" ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <BackButton onClick={() => { setStep("FORGOT_PASSWORD"); setError(""); }} />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Create New Password
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Enter your reset token and create a new password.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reset token from email"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-4 pr-4 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter a strong password"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-4 pr-12 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm">
                      <p className="text-xs font-bold text-gray-600 mb-2">Password Requirements:</p>
                      <div className="space-y-1 text-xs">
                        <p className={validatePassword(newPassword).hasMinLength ? "text-green-600" : "text-red-600"}>
                          ✓ At least 8 characters
                        </p>
                        <p className={validatePassword(newPassword).hasUpperCase ? "text-green-600" : "text-red-600"}>
                          ✓ One uppercase letter
                        </p>
                        <p className={validatePassword(newPassword).hasLowerCase ? "text-green-600" : "text-red-600"}>
                          ✓ One lowercase letter
                        </p>
                        <p className={validatePassword(newPassword).hasNumber ? "text-green-600" : "text-red-600"}>
                          ✓ One number
                        </p>
                        <p className={validatePassword(newPassword).hasSpecialChar ? "text-green-600" : "text-red-600"}>
                          ✓ One special character (!@#$%^&*)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center group disabled:opacity-50"
                >
                  {isLoading ? (
                    "Resetting..."
                  ) : (
                    <>
                      Reset Password{" "}
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
          <div className="text-xs text-blue-700 leading-relaxed space-y-1">
            <p>Backend Integration Active.</p>
            <p>• Enter a valid email found in backend (or any new email to register).</p>
            <p>• Check backend logs for OTP if email sending fails locally.</p>
            <p>• Team members use the credentials provided by their admin.</p>
          </div>
        </div>
      </div>

      {/* First-Time Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
            <p className="text-gray-600 text-sm mb-6">
              This is your first login. Please set a permanent password for your account.
            </p>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleChangePasswordFirstLogin} className="space-y-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showChangedPassword ? "text" : "password"}
                    required
                    placeholder="Enter a strong password"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-4 pr-12 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                    value={changedPassword}
                    onChange={(e) => setChangedPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowChangedPassword(!showChangedPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showChangedPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {changedPassword && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm">
                    <p className="text-xs font-bold text-gray-600 mb-2">Password Requirements:</p>
                    <div className="space-y-1 text-xs">
                      <p className={validatePassword(changedPassword).hasMinLength ? "text-green-600" : "text-red-600"}>
                        ✓ At least 8 characters
                      </p>
                      <p className={validatePassword(changedPassword).hasUpperCase ? "text-green-600" : "text-red-600"}>
                        ✓ One uppercase letter
                      </p>
                      <p className={validatePassword(changedPassword).hasLowerCase ? "text-green-600" : "text-red-600"}>
                        ✓ One lowercase letter
                      </p>
                      <p className={validatePassword(changedPassword).hasNumber ? "text-green-600" : "text-red-600"}>
                        ✓ One number
                      </p>
                      <p className={validatePassword(changedPassword).hasSpecialChar ? "text-green-600" : "text-red-600"}>
                        ✓ One special character (!@#$%^&*)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showChangedConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirm your password"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-4 pr-12 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                    value={changedConfirmPassword}
                    onChange={(e) => setChangedConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowChangedConfirmPassword(!showChangedConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showChangedConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center group disabled:opacity-50"
              >
                {isLoading ? (
                  "Setting Password..."
                ) : (
                  <>
                    Set Password{" "}
                    <ArrowRight
                      className="ml-2 group-hover:translate-x-1 transition-transform"
                      size={20}
                    />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
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