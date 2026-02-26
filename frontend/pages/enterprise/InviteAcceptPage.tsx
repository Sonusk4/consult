import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth as authService } from "../../services/api";
import { useAuth } from "../../App";
import { UserRole } from "../../types";
import { CheckCircle, Loader, AlertCircle } from "lucide-react";

interface InviteData {
  valid: boolean;
  email: string;
  name: string;
}

const InviteAcceptPage: React.FC = () => {
  console.log("🚀 InviteAcceptPage component LOADED");
  
  const { token } = useParams();
  console.log("🔑 Token from params:", token);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [step, setStep] = useState<"verify" | "details" | "success">("verify");
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ================= VERIFY INVITE ================= */
  const verifyInvite = useCallback(async () => {
    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await authService.acceptInvitation(token, "", "", "", "");
      // This will fail because we're not providing data yet, but it gives us info
    } catch (err: any) {
      // This is expected - we just want to check if token is valid
      const errorMsg = err.response?.data?.error || "";
      if (errorMsg.includes("firebase_uid") || errorMsg.includes("Password")) {
        // Token is valid, just missing data
        setStep("details");
        // Try to get invite details from a separate endpoint if available
        const inviteDetails = err.response?.data?.inviteData;
        if (inviteDetails) {
          setInviteData(inviteDetails);
          setFormData({
            email: inviteDetails.email || "",
            name: inviteDetails.name || "",
            phone: "",
            password: "",
            confirmPassword: "",
          });
        }
      } else {
        setError(
          err.response?.data?.error ||
            "Invalid or expired invitation link. Please contact your administrator."
        );
        setStep("verify");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (step === "verify") {
      verifyInvite();
    }
  }, [step, verifyInvite]);

  /* ================= VALIDATE FORM ================= */
  const validateDetailsForm = (): boolean => {
    if (!formData.phone) {
      setError("Phone number is required");
      return false;
    }
    if (!formData.name) {
      setError("Full name is required");
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  /* ================= ACCEPT INVITE ================= */
  const handleAcceptInvite = async () => {
    if (!validateDetailsForm()) return;

    try {
      setSubmitting(true);
      setError("");

      console.log("🔄 Starting invitation acceptance...");

      // Generate firebase_uid the same way the authMiddleware does in dev mode
      const mockFirebaseUid = `mock-uid-${formData.email.replace(/@/g, "-at-").replace(/\./g, "-dot-")}`;
      console.log("🔑 Generated mock Firebase UID:", mockFirebaseUid);

      console.log("📤 Sending accept-invite request...");
      const response = await authService.acceptInvitation(
        token || "",
        mockFirebaseUid,
        formData.phone,
        formData.name,
        formData.password
      );

      console.log("✅ Accept-invite response received:", response);

      // Store user data
      const userData = response.user;
      const userToStore = {
        id: userData.id,
        email: userData.email,
        name: userData.name || formData.name,
        role: UserRole.CONSULTANT, // Individual consultant created from enterprise member invitation
        avatar: userData.avatar,
        is_verified: true,
        firebase_uid: mockFirebaseUid,
      };

      console.log("💾 Storing user in localStorage:", userToStore);
      localStorage.setItem("user", JSON.stringify(userToStore));

      // Update auth context
      console.log("🔐 Updating user state in Auth context...");
      setUser(userToStore);
      console.log("✅ User state updated");

      console.log("🎉 Moving to success step");
      setStep("success");
    } catch (err: any) {
      console.error("❌ Accept invite error:", err);
      setError(
        err.response?.data?.error || "Failed to accept invitation. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= LOADING STATE ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600">Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  /* ================= VERIFICATION FAILED ================= */
  if (step === "verify" && error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
          <AlertCircle className="text-red-600 mx-auto" size={48} />
          <h1 className="text-2xl font-bold text-gray-900">Invalid Invitation</h1>
          <p className="text-gray-600">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  /* ================= DETAILS FORM ================= */
  if (step === "details") {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Welcome! 🎉</h1>
            <p className="text-gray-600">Complete your profile to get started</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900">
              Welcome to ConsultaPro! 👋
            </p>
            <p className="text-xs text-blue-800">
              You've been invited to join our team as a consultant. Fill in your details to complete your account setup.
            </p>
          </div>

          <div className="space-y-4">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full border rounded-xl px-4 py-3 bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">From your invitation</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Create Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter your password"
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900 font-semibold">
              🔐 Secure your account
            </p>
            <p className="text-xs text-blue-800 mt-1">
              Create a strong password that you'll use to login with your email.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAcceptInvite}
            disabled={submitting || !formData.name || !formData.phone || !formData.password || !formData.confirmPassword}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader size={18} className="animate-spin" />
                Creating your account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ================= SUCCESS STATE ================= */
  if (step === "success") {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
          <CheckCircle className="text-green-600 mx-auto animate-bounce" size={64} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Account Ready! 🎊
            </h1>
            <p className="text-gray-600">
              Your consultant profile has been created successfully, {formData.name}!
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-sm text-green-900">
              <span className="font-semibold">✓ Account created</span>
            </p>
            <p className="text-sm text-green-900">
              <span className="font-semibold">✓ Consultant profile created</span>
            </p>
            <p className="text-sm text-green-900">
              <span className="font-semibold">✓ Password set</span>
            </p>
            <p className="text-sm text-green-900">
              <span className="font-semibold">✓ Ready to login</span>
            </p>
          </div>

          {/* Login Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-blue-900">
              🔐 Login Credentials:
            </p>
            <div className="bg-white p-3 rounded border border-blue-200 space-y-2">
              <div>
                <p className="text-xs text-gray-500">Email:</p>
                <p className="font-mono text-sm text-gray-900">{formData.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Password:</p>
                <p className="text-sm text-gray-900">The password you just created</p>
              </div>
            </div>
            <p className="text-xs text-blue-800 mt-2">
              💡 Use these credentials to login and access your consultant dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate("/auth?type=LOGIN")}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Go to Login
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Return to Home
            </button>
          </div>

          <p className="text-xs text-gray-500">
            ✨ Welcome to the ConsultaPro team!
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default InviteAcceptPage;
