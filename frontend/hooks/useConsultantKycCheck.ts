import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { consultants as consultantsApi } from "../services/api.js";

/**
 * Hook to check consultant KYC approval status
 * Returns kycStatus and blocks page if not approved
 * Shows pending approval screen instead
 */
export const useConsultantKycCheck = () => {
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApprovalSuccess, setIsApprovalSuccess] = useState(false);
  const navigate = useNavigate();

  const checkKycStatus = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await consultantsApi.getProfile();
      
      if (profile?.kyc_status) {
        // Check if this is first load after approval (store in session)
        const previousStatus = sessionStorage.getItem("consultantKycStatus");
        if (previousStatus && previousStatus !== "APPROVED" && profile.kyc_status === "APPROVED") {
          setIsApprovalSuccess(true);
        }
        sessionStorage.setItem("consultantKycStatus", profile.kyc_status);
        setKycStatus(profile.kyc_status);
      }
    } catch (error) {
      console.error("Failed to check KYC status:", error);
      // If profile doesn't exist, they need to complete registration first
      setKycStatus("PENDING");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkKycStatus();
  }, [checkKycStatus]);

  return { kycStatus, loading, isApprovalSuccess, refetch: checkKycStatus };
};

export default useConsultantKycCheck;
