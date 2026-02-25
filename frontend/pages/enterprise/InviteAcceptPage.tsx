import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../App";
import { UserRole } from "../../types";
import { CheckCircle, Loader, AlertCircle, Eye, EyeOff } from "lucide-react";

interface InviteData {
  valid: boolean;
  email: string;
  name: string;
  username: string;
  temp_password: string;
}

const InviteAcceptPage: React.FC = () => {
  console.log("🚀 InviteAcceptPage component LOADED");
  
  const { token } = useParams();
  console.log("🔑 Token from params:", token);
  const navigate = useNavigate();
  const { login: authLogin, setUser } = useAuth();

  const [step, setStep] = useState<"verify" | "details" | "confirm-password" | "success">("verify");
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
  });

  const [submitting, setSubmitting] = useState(false);

  /* ================= VERIFY INVITE ================= */
  const verifyInvite = useCallback(async () => {
    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/enterprise/invite/${token}`);
      const data = res.data;

      setInviteData(data);
      setFormData({
        email: data.email || "",
        username: data.username || "",
        password: "",
        confirmPassword: "",
        name: data.name || "",
        phone: "",
      });

      setStep("confirm-password");
      setError("");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Invalid or expired invitation link. Please contact your administrator."
      );
      setStep("verify");
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
  const validatePasswordForm = (): boolean => {
    if (!formData.password) {
      setError("Please enter the password from your email");
      return false;
    }
    if (formData.password !== inviteData?.temp_password) {
      setError("Password does not match. Please check the password in your email.");
      return false;
    }
    return true;
  };

  const validateDetailsForm = (): boolean => {
    if (!formData.phone) {
      setError("Phone number is required");
      return false;
    }
    if (!formData.name) {
      setError("Full name is required");
      return false;
    }
    return true;
  };

  /* ================= PROCEED TO DETAILS ================= */
  const handlePasswordVerified = () => {
    if (!validatePasswordForm()) return;
    setError("");
    setStep("details");
  };

  /* ================= ACCEPT INVITE & SIGNUP ================= */
  const handleAcceptInvite = async () => {
    if (!validateDetailsForm()) return;

    try {
      setSubmitting(true);
      setError("");

      console.log("🔄 Starting invitation acceptance...");

      // Generate firebase_uid the same way the authMiddleware does in dev mode
      const mockFirebaseUid = `mock-uid-${formData.email.replace(/@/g, '-at-').replace(/\./g, '-dot-')}`;
      console.log("🔑 Generated mock Firebase UID:", mockFirebaseUid);

      console.log("📤 Sending accept-invite request...");
      const response = await api.post("/enterprise/accept-invite", {
        token,
        firebase_uid: mockFirebaseUid,
        phone: formData.phone,
        name: formData.name,
      });

      console.log("✅ Accept-invite response received:", response.data);

      // Login the user after accepting invite
      const userData = response.data.user;
      const userToStore = {
        id: userData.id,
        email: userData.email,
        name: userData.name || formData.name,
        role: UserRole.ENTERPRISE_MEMBER,
        avatar: userData.avatar,
        is_verified: true,
        firebase_uid: mockFirebaseUid
      };

      console.log("💾 Storing user in localStorage:", userToStore);
      localStorage.setItem("user", JSON.stringify(userToStore));

      // Update auth context directly
      console.log("🔐 Updating user state in Auth context...");
      setUser(userToStore);
      console.log("✅ User state updated");

      console.log("🎉 Setting step to success");
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

  /* ================= AUTO REDIRECT ON SUCCESS ================= */
  useEffect(() => {
    if (step === "success") {
      console.log("✅ Success step reached, starting redirect timer...");
      const timer = setTimeout(() => {
        console.log("🚀 Redirecting to member dashboard...");
        navigate("/member/dashboard");
      }, 2000);
      return () => {
        console.log("🧹 Cleaning up redirect timer");
        clearTimeout(timer);
      };
    }
  }, [step, navigate]);

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

  /* ================= CONFIRM PASSWORD FORM ================= */
  if (step === "confirm-password") {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Welcome! 🎉</h1>
            <p className="text-gray-600">Verify your credentials to proceed</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Check your email</span> for your temporary credentials:
            </p>
            <ul className="text-sm text-blue-900 space-y-1 ml-4">
              <li>• <span className="font-semibold">Email:</span> {formData.email}</li>
              <li>• <span className="font-semibold">Username:</span> {formData.username}</li>
              <li>• <span className="font-semibold">Password:</span> Check your email</li>
            </ul>
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
                className="w-full border rounded-xl px-4 py-3 bg-gray-50 text-gray-600"
              />
            </div>

            {/* Username (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                disabled
                className="w-full border rounded-xl px-4 py-3 bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Generated for your account</p>
            </div>

            {/* Password from Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter Password from Email
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Paste your temporary password"
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Check your email for the temporary password
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePasswordVerified}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Continue
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
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-600">Just a few more details to finish setup</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

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
                className="w-full border rounded-xl px-4 py-3 bg-gray-50 text-gray-600"
              />
            </div>

            {/* Username (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                disabled
                className="w-full border rounded-xl px-4 py-3 bg-gray-50 text-gray-600"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter your full name"
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91 XXXXX XXXXX"
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-900">
              ✓ You'll use your email and temporary password to login
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("confirm-password")}
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleAcceptInvite}
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size={18} className="animate-spin" />
                  Finalizing...
                </span>
              ) : (
                "Confirm & Continue"
              )}
            </button>
          </div>
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
              Account Created! 🎊
            </h1>
            <p className="text-gray-600">
              Welcome to the enterprise team, {formData.name}!
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-sm text-green-900">
              <span className="font-semibold">✓ Account verified</span>
            </p>
            <p className="text-sm text-green-900">
              <span className="font-semibold">✓ Profile complete</span>
            </p>
            <p className="text-sm text-green-900">
              <span className="font-semibold">✓ Ready to use</span>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              Your login credentials:
            </p>
            <p className="text-sm text-blue-900 mt-2">
              <span className="font-semibold">Email:</span> {formData.email}
            </p>
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Password:</span> Use the temporary password from your email
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/member/dashboard")}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>

          <p className="text-xs text-gray-500">
            Redirecting automatically in 2 seconds...
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default InviteAcceptPage;
