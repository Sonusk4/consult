import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, AlertCircle, Check, LogOut } from "lucide-react";
import { useAuth } from "../App";
import { useToast } from "../context/ToastContext";

interface ConsultantKycGateProps {
  children: React.ReactNode;
  kycStatus?: string | null;
  showSuccessModal?: boolean;
}

/**
 * ConsultantKycGate - Wrapper component that gates consultant pages based on kyc_status
 * Shows pending approval screen if not approved
 * Shows success modal if just approved
 * Allows access to full dashboard if approved
 */
export const ConsultantKycGate: React.FC<ConsultantKycGateProps> = ({
  children,
  kycStatus,
  showSuccessModal = false,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { addToast } = useToast();
  const [showSuccess, setShowSuccess] = useState(showSuccessModal);

  useEffect(() => {
    // Show success toast if just approved
    if (showSuccessModal) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  // If no KYC status or APPROVED, show children (full access)
  if (!kycStatus || kycStatus === "APPROVED") {
    return (
      <>
        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
                ✅ Account Approved!
              </h2>
              <p className="text-gray-600 text-center mb-2">
                Congratulations! Your account has been successfully approved by our admin.
              </p>
              <p className="text-gray-600 text-center mb-6">
                You now have full access to your consultant dashboard.
              </p>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Start Consulting
              </button>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  // Pending or Submitted approval - show blocking screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Status Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-blue-100 rounded-full p-4">
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Account Under Review
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Your account is currently under review. You'll have full access to your dashboard once it's approved within <span className="font-semibold text-blue-600">24 to 48 hours</span>.
          </p>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">Approval Timeline:</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">KYC Information Submitted</p>
                  <p className="text-sm text-gray-600 mt-1">Your profile has been submitted</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Verification in Progress</p>
                  <p className="text-sm text-gray-600 mt-1">We're verifying your details</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100">
                    <Check className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Account Approved</p>
                  <p className="text-sm text-gray-600 mt-1">Get full access to your dashboard</p>
                </div>
              </div>
            </div>
          </div>

          {/* What to expect */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Blocked Features Until Approval
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Messages & Video Calls</li>
              <li>• Bookings & Schedule</li>
              <li>• Earnings & Payments</li>
              <li>• Support Tickets</li>
              <li>• Profile Management</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={logout}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>

          {/* Status Badge */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Status: <span className="font-semibold text-gray-900">
                {kycStatus === "PENDING" ? "Pending Submission" : 
                 kycStatus === "SUBMITTED" ? "Under Review" : 
                 "Processing"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultantKycGate;
