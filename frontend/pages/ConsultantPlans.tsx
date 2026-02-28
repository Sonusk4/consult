import React, { useState } from "react";
import Layout from "../components/Layout";
import { subscriptions, users } from "../services/api";
import { X, Check, Star, TrendingUp, MessageCircle, Wallet, ArrowUp, AlertCircle, Crown, Zap, Shield, Sparkles, CheckCircle } from "lucide-react";
import { useToast } from "../context/ToastContext";

// Payment Success Modal Component
const PaymentSuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  message: string;
}> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful!</h2>
          <p className="text-gray-600 mb-8">{message}</p>
        </div>

        {/* OK Button */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const BASE_PLATFORM_FEE = 20;

// Badge Components
const VerifiedBadge = () => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    <Check className="w-3 h-3 mr-1" />
    Verified
  </span>
);

const TrustedBadge = () => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
    <Star className="w-3 h-3 mr-1" />
    Trusted
  </span>
);

const EliteBadge = () => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
    <TrendingUp className="w-3 h-3 mr-1" />
    Elite
  </span>
);

const Row = ({ label, value }: any) => (
  <div className="flex justify-between border-b pb-2">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

const plans = [
  {
    name: "Free",
    reduction: 0,
    ranking: "Low",
    chat: "5",
    badge: "No Badge",
    placement: "No",
    payout: "T+7",
    manager: "No",
    analytics: "No",
    customPricing: "Yes",
    leadMatching: "No",
    caseStudy: "No",
    highlight: false,
  },
  {
    name: "Professional",
    reduction: 2,
    ranking: "Medium",
    chat: "20",
    badge: <VerifiedBadge />,
    placement: "Category Page",
    payout: "T+5",
    manager: "No",
    analytics: "No",
    customPricing: "Yes",
    leadMatching: "No",
    caseStudy: "No",
    highlight: false,
  },
  {
    name: "Premium",
    reduction: 5,
    ranking: "High",
    chat: "50",
    badge: <TrustedBadge />,
    placement: "Weekly Feature",
    payout: "T+3",
    manager: "No",
    analytics: "V2.0",
    customPricing: "Yes",
    leadMatching: "V2.0",
    caseStudy: "V2.0",
    highlight: true,
  },
  {
    name: "Elite",
    reduction: 10,
    ranking: "Top Priority",
    chat: "Unlimited",
    badge: <EliteBadge />,
    placement: "Homepage Rotation",
    payout: "Instant",
    manager: "Yes",
    analytics: "V2.0",
    customPricing: "Yes",
    leadMatching: "V2.0",
    caseStudy: "V2.0",
    highlight: false,
  },
];

const chatCreditsPacks = [
  {
    name: "Mini Pack",
    messages: "50 Messages",
    price: "TBD",
    validity: "Valid for 30 days",
    popular: false,
  },
  {
    name: "Starter Pack",
    messages: "150 Messages",
    price: "TBD",
    validity: "Valid for 45 days",
    popular: true,
  },
  {
    name: "Pro Pack",
    messages: "300 Messages",
    price: "TBD",
    validity: "Valid for 60 days",
    popular: false,
  },
];

const walletRechargePlans = [
  {
    amount: 1000,
    bonus: 1025,
    percentage: "2.5%",
    credits: "5 Bonus Credits",
    color: "blue",
  },
  {
    amount: 5000,
    bonus: 5200,
    percentage: "4%",
    credits: "25 Bonus Credits",
    color: "green",
    popular: true,
  },
  {
    amount: 10000,
    bonus: 10500,
    percentage: "5%",
    credits: "50 Bonus Credits",
    color: "purple",
  },
];

const importantTerms = [
  "Credits non-refundable",
  "Credits non-transferable",
  "Chat Credits expire in 30-60 days",
  "Cannot use credits for video calls",
  "Cannot use credits for cancellation",
];

const ConsultantPlans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState('');
  const { addToast } = useToast();

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) throw new Error("Razorpay SDK failed to load. Are you online?");

      // 1. Create Order
      const orderData = await subscriptions.createOrderConsultant(selectedPlan.name);

      // 2. Fetch User Profile
      let userName = "Consultant";
      let userEmail = "consultant@example.com";
      try {
        const profileResponse = await users.getProfile();
        if (profileResponse?.name) userName = profileResponse.name;
        if (profileResponse?.email) userEmail = profileResponse.email;
      } catch (e) {
        // fail silently
      }

      // 3. Init Razorpay
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: "INR",
        name: "ConsultPro",
        description: `${selectedPlan.name} Subscription for Consultants`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            setLoading(true);
            await subscriptions.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName: selectedPlan.name,
              userType: "CONSULTANT",
            });
            setPaymentSuccessMessage(`You are now on the ${selectedPlan.name} plan! An email receipt has been sent.`);
            setShowPaymentSuccess(true);
            setSelectedPlan(null);
          } catch (err: any) {
            addToast(`Verification failed: ${err.message}`, 'error');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: "#2563EB",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      addToast(`Subscription failed: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  function getPayoutExplanation(payout: string): string {
    switch (payout) {
      case "T+7":
        return "Paid 7 days after transaction completion";
      case "T+5":
        return "Paid 5 days after transaction completion";
      case "T+3":
        return "Paid 3 days after transaction completion";
      case "Instant":
        return "Immediate payout after transaction";
      default:
        return "Standard payout timing";
    }
  }

  return (
    <Layout title="Subscription Plans">
      <div className="max-w-7xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-center mb-10">
          Consultant Subscription Plans
        </h1>

        {/* Consultant Plans Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                plan.name === "Free" 
                  ? "bg-slate-100 border-slate-300 hover:bg-slate-200"
                  : plan.name === "Professional"
                  ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                  : plan.name === "Premium"
                  ? "bg-green-50 border-green-200 hover:bg-green-100"
                  : "bg-purple-50 border-purple-200 hover:bg-purple-100"
              } ${
                plan.highlight ? "ring-2 ring-blue-600 shadow-md" : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              <div className="text-center mb-4">
                {plan.name === "Free" && (
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                )}
                {plan.name === "Professional" && (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-blue-600" />
                  </div>
                )}
                {plan.name === "Premium" && (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-green-600" />
                  </div>
                )}
                {plan.name === "Elite" && (
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                )}
                
                <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {plan.name === "Free" && "Perfect for getting started"}
                  {plan.name === "Professional" && "For growing consultants"}
                  {plan.name === "Premium" && "Advanced features & visibility"}
                  {plan.name === "Elite" && "Maximum benefits & support"}
                </p>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Chat Limit</span>
                  <span className="font-medium">{plan.chat}/month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform Fee</span>
                  <span className="font-medium">-{plan.reduction}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Badge</span>
                  <div className="flex justify-center">
                    {typeof plan.badge === 'string' ? (
                      <span className="text-xs">{plan.badge}</span>
                    ) : (
                      plan.badge
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedPlan(plan)}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  plan.highlight
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-gray-300 hover:bg-gray-100"
                }`}
              >
                View Details
              </button>
            </div>
          ))}
        </div>

        {/* Chat Credits Packs Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Chat Credits Packs</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {chatCreditsPacks.map((pack) => (
              <div
                key={pack.name}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  pack.popular
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      POPULAR
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-center mb-2">{pack.name}</h3>
                <p className="text-3xl font-bold text-center mb-2">{pack.messages}</p>
                <p className="text-2xl font-semibold text-center mb-2">{pack.price}</p>
                <p className="text-sm text-gray-600 text-center mb-4">{pack.validity}</p>
                <button
                  className={`w-full py-3 rounded-xl font-semibold transition ${
                    pack.popular
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  Buy
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* When you exhaust your monthly chat limit */}
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-center mb-2">
            When you exhaust your monthly chat limit
          </h2>
          <p className="text-center text-gray-600 mb-8">
            You've reached your monthly limit. Continue instantly using Chat Credits.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Upgrade Plan</h3>
              <p className="text-sm text-gray-600">Better value with higher limits</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Buy Chat Credits</h3>
              <p className="text-sm text-gray-600">Quick fix to continue chatting</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Recharge Wallet</h3>
              <p className="text-sm text-gray-600">Get bonus credits</p>
            </div>
          </div>
        </div>

        {/* Wallet Recharge Bonus Structure */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Wallet Recharge Bonus Structure</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {walletRechargePlans.map((plan) => (
              <div
                key={plan.amount}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  plan.color === "blue"
                    ? "border-blue-200 bg-blue-50"
                    : plan.color === "green"
                    ? "border-green-200 bg-green-50"
                    : "border-purple-200 bg-purple-50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      POPULAR
                    </span>
                  </div>
                )}
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold mb-1">₹{plan.amount}</p>
                  <p className="text-2xl font-semibold">₹{plan.bonus}</p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      plan.color === "blue"
                        ? "bg-blue-500 text-white"
                        : plan.color === "green"
                        ? "bg-green-500 text-white"
                        : "bg-purple-500 text-white"
                    }`}
                  >
                    {plan.percentage} Bonus
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        plan.color === "blue"
                          ? "bg-blue-500"
                          : plan.color === "green"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    />
                    <span>{plan.credits}</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        plan.color === "blue"
                          ? "bg-blue-500"
                          : plan.color === "green"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    />
                    <span>Usable only for platform fee</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        plan.color === "blue"
                          ? "bg-blue-500"
                          : plan.color === "green"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    />
                    <span>Expires in 60 days</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        plan.color === "blue"
                          ? "bg-blue-500"
                          : plan.color === "green"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    />
                    <span>Non-withdrawable</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Terms */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Important Terms</h2>
          <div className="space-y-3">
            {importantTerms.map((term, index) => (
              <div key={index} className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{term}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= MODAL ================= */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 relative">
              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center">
                  {selectedPlan.name === "Free" && (
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                  )}
                  {selectedPlan.name === "Professional" && (
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <Check className="w-10 h-10 text-blue-600" />
                    </div>
                  )}
                  {selectedPlan.name === "Premium" && (
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <Star className="w-10 h-10 text-green-600" />
                    </div>
                  )}
                  {selectedPlan.name === "Elite" && (
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-10 h-10 text-purple-600" />
                    </div>
                  )}
                </div>
                <h2 className="text-3xl font-bold mb-2">{selectedPlan.name} Plan</h2>
                <p className="text-gray-600">
                  {selectedPlan.name === "Free" && "Perfect for getting started with basic features"}
                  {selectedPlan.name === "Professional" && "Ideal for growing consultants with more visibility"}
                  {selectedPlan.name === "Premium" && "Advanced features for established consultants"}
                  {selectedPlan.name === "Elite" && "Maximum benefits and dedicated support"}
                </p>
              </div>

              {/* Plan Features Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Search Ranking */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Search Ranking</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{selectedPlan.ranking}</p>
                  <p className="text-sm text-gray-600">
                    {selectedPlan.ranking === "Low" && "Basic visibility in search results"}
                    {selectedPlan.ranking === "Medium" && "Improved visibility in consultant listings"}
                    {selectedPlan.ranking === "High" && "Priority placement in search results"}
                    {selectedPlan.ranking === "Top Priority" && "Highest visibility across all searches"}
                  </p>
                </div>

                {/* Chat Limit */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Inbound Chat Limit</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{selectedPlan.chat}/Month</p>
                  <p className="text-sm text-gray-600">
                    {selectedPlan.chat === "5" && "Perfect for testing the platform"}
                    {selectedPlan.chat === "20" && "Good for steady client engagement"}
                    {selectedPlan.chat === "50" && "Excellent for active consultants"}
                    {selectedPlan.chat === "Unlimited" && "No limits on client conversations"}
                  </p>
                </div>

                {/* Badge */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <Star className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Pro/Elite Badge</h3>
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    {typeof selectedPlan.badge === 'string' ? (
                      <span className="text-lg font-medium">{selectedPlan.badge}</span>
                    ) : (
                      selectedPlan.badge
                    )}
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {selectedPlan.name === "Free" && "No verification badge"}
                    {selectedPlan.name === "Professional" && "Builds trust with clients"}
                    {selectedPlan.name === "Premium" && "Shows expertise and reliability"}
                    {selectedPlan.name === "Elite" && "Premium status symbol"}
                  </p>
                </div>

                {/* Featured Placement */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <ArrowUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Featured Placement</h3>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-1">{selectedPlan.placement}</p>
                  <p className="text-sm text-gray-600">
                    {selectedPlan.placement === "No" && "Standard listing only"}
                    {selectedPlan.placement === "Category Page" && "Featured in relevant categories"}
                    {selectedPlan.placement === "Weekly Feature" && "Regular homepage rotation"}
                    {selectedPlan.placement === "Homepage Rotation" && "Premium placement visibility"}
                  </p>
                </div>

                {/* Platform Fee Reduction */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                      <Wallet className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Platform Fee Reduction</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">-{selectedPlan.reduction}%</p>
                  <p className="text-sm text-gray-600">
                    Final platform fee: {BASE_PLATFORM_FEE - selectedPlan.reduction}%
                    {selectedPlan.reduction === 0 && " (Standard rate)"}
                    {selectedPlan.reduction > 0 && " (Reduced rate)"}
                  </p>
                </div>

                {/* Payout Frequency */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Payout Frequency</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{selectedPlan.payout}</p>
                  <p className="text-sm text-gray-600">
                    {getPayoutExplanation(selectedPlan.payout)}
                  </p>
                </div>
              </div>

              {/* Additional Features */}
              <div className="bg-blue-50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Additional Features</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium">Analytics Access</p>
                      <p className="text-sm text-gray-600">{selectedPlan.analytics}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium">Custom Pricing Packages</p>
                      <p className="text-sm text-gray-600">{selectedPlan.customPricing}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium">Lead Matching Priority</p>
                      <p className="text-sm text-gray-600">{selectedPlan.leadMatching}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium">Case Study Publishing</p>
                      <p className="text-sm text-gray-600">{selectedPlan.caseStudy}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium">Dedicated Account Manager</p>
                      <p className="text-sm text-gray-600">{selectedPlan.manager}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Subscribe Now"}
                </button>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment Success Modal */}
        <PaymentSuccessModal
          isOpen={showPaymentSuccess}
          onClose={() => setShowPaymentSuccess(false)}
          message={paymentSuccessMessage}
        />
      </div>
    </Layout>
  );
};

const Detail = ({ title, description }: any) => (
  <div className="border rounded-xl p-4 bg-gray-50">
    <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
    <p className="text-gray-600 whitespace-pre-line">{description}</p>
  </div>
);

export default ConsultantPlans;