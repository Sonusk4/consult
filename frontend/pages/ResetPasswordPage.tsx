import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { auth } from "../services/api";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

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

  const passwordValidation = validatePassword(newPassword);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !email) {
      setError("Invalid reset link. Token or email is missing.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!passwordValidation.isValid) {
      setError("Password must contain: 8+ characters, uppercase, lowercase, number, and special character (!@#$%^&*)");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      console.log("Resetting password with token and email:", email);
      const response = await auth.resetPassword(token, newPassword, email);
      console.log("Password reset successful:", response);
      setResetSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Password reset failed:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Failed to reset password. Please try again.";

      if (errorMessage.includes("expired")) {
        setError("Reset link has expired. Please request a new one.");
      } else if (errorMessage.includes("invalid")) {
        setError("Invalid reset link. Please request a new password reset.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Reset Link</h1>
          <p className="text-gray-600 mb-6">
            The password reset link is invalid or has expired. Please request a new one from the login page.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <span className="text-3xl">✓</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your password has been reset successfully. You will be redirected to the login page shortly.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
        <p className="text-gray-500 text-sm mb-6">
          Enter your new password below. It must be strong and contain uppercase, lowercase, numbers, and special characters.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl pl-4 pr-12 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="mt-3 space-y-2 text-xs">
              <div className={`flex items-center space-x-2 ${passwordValidation.hasMinLength ? "text-green-600" : "text-gray-400"}`}>
                <span>{passwordValidation.hasMinLength ? "✓" : "○"}</span>
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasUpperCase ? "text-green-600" : "text-gray-400"}`}>
                <span>{passwordValidation.hasUpperCase ? "✓" : "○"}</span>
                <span>One uppercase letter (A-Z)</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasLowerCase ? "text-green-600" : "text-gray-400"}`}>
                <span>{passwordValidation.hasLowerCase ? "✓" : "○"}</span>
                <span>One lowercase letter (a-z)</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasNumber ? "text-green-600" : "text-gray-400"}`}>
                <span>{passwordValidation.hasNumber ? "✓" : "○"}</span>
                <span>One number (0-9)</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasSpecialChar ? "text-green-600" : "text-gray-400"}`}>
                <span>{passwordValidation.hasSpecialChar ? "✓" : "○"}</span>
                <span>One special character (!@#$%^&*)</span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl pl-4 pr-12 py-4 text-gray-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-2 text-xs text-red-600">Passwords do not match</p>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword && (
              <p className="mt-2 text-xs text-green-600">Passwords match ✓</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !passwordValidation.isValid}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Resetting Password...
              </>
            ) : (
              <>
                Reset Password
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Remember your password?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 font-bold hover:underline"
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
