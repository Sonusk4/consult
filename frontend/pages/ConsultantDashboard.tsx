import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { consultants as consultantsApi, subscriptions, bookings, payments } from "../services/api";
import { Consultant } from "../types";
import { Loader, Users, Calendar, DollarSign, Star, MessageSquare, TrendingUp, Bell, Clock, CheckCircle, XCircle, AlertCircle, Video, Edit, Trash2, Plus, ArrowRight, Eye, Check, Crown } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../App";

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

// Badge Components (matching plans page)
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

const FreeBadge = () => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
    <Users className="w-3 h-3 mr-1" />
    Free
  </span>
);

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

// Helper function to check if a booking is currently live
const isBookingLive = (booking: any): boolean => {
  if (!booking?.date || !booking?.time_slot) return false;
  try {
    const bookingDate = new Date(booking.date);
    const [slotHour, slotMin] = booking.time_slot.split(":").map(Number);
    const start = new Date(bookingDate);
    start.setHours(slotHour, slotMin, 0, 0);
    const end = new Date(start);
    end.setHours(slotHour + 1, slotMin, 0, 0);
    const now = new Date();
    return now >= start && now < end;
  } catch {
    return false;
  }
};

const ConsultantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // State variables
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [showRegistrationFee, setShowRegistrationFee] = useState(false);
  const [registrationFeeDeducted, setRegistrationFeeDeducted] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [reviews, setReviews] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [liveSession, setLiveSession] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState({
    // All mandatory fields for backend
    type: "Individual",
    domain: "",
    hourly_price: "",
    bio: "",
    languages: "",
    designation: "",
    years_experience: "",
    education: "",
    availability: "Flexible",
    linkedin: "",
    other_social: "",
    profile_pic: "",
  });

  const fetchProfile = async () => {
    try {
      const data = await consultantsApi.getProfile();
      setProfile(data);
    } catch (error: any) {
      // If 404, it means consultant profile not created yet - that's fine, show registration form
      if (error.response?.status === 404) {
        console.log('⏳ No consultant profile yet - showing registration form');
        setProfile(null);
      } else {
        console.error('Failed to fetch consultant profile:', error);
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUsage();
    fetchUpcomingSessions();
    fetchEarnings();
    fetchReviews();
    fetchNotifications();
    fetchMessages();
    fetchAvailability();
    fetchPerformanceMetrics();
  }, []);

  // Poll for live sessions every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUpcomingSessions();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);


  // Listen for subscription updates from payment success
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      console.log('🔄 Subscription update event received, refreshing dashboard...');
      refreshProfile();
      addToast('Subscription updated successfully!', 'success');
    };

    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);

    return () => {
      window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
    };
  }, []);

  useEffect(() => {
    if (profile) {
      setOnboardingData(prev => ({
        ...prev,
        domain: profile.domain || prev.domain,
        hourly_price: profile.hourly_price?.toString() || prev.hourly_price,
        bio: profile.bio || prev.bio,
        languages: profile.languages || prev.languages,
        designation: profile.designation || prev.designation,
        years_experience: profile.years_experience?.toString() || prev.years_experience,
        education: profile.education || prev.education,
        availability: profile.availability || prev.availability,
        linkedin: profile.linkedin_url || prev.linkedin,
        other_social: profile.website_url || prev.other_social,
        profile_pic: profile.profile_pic || prev.profile_pic,
      }));
    }
  }, [profile]);

  const fetchUsage = async () => {
    try {
      const data = await subscriptions.getUsageMetrics();
      setUsage(data); // Store usage data in state
      console.log('📊 Consultant usage data:', data);
    } catch (error) {
      console.error('Failed to fetch usage metrics:', error);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
    await fetchUsage(); // Also refresh usage metrics
  };

  // Function to handle successful subscription purchase
  const handleSubscriptionSuccess = async () => {
    // Refetch consultant data to get updated subscription info
    await refreshProfile();
    addToast('Subscription updated successfully!', 'success');
  };

  const fetchUpcomingSessions = async () => {
    try {
      const data = await consultantsApi.getConsultantBookings();
      setUpcomingSessions(data || []);
      
      // Check for live sessions
      const activeLiveSession = (data || []).find((booking: any) => isBookingLive(booking));
      setLiveSession(activeLiveSession || null);
    } catch (error) {
      console.error('Failed to fetch upcoming sessions:', error);
      setUpcomingSessions([]);
      setLiveSession(null);
    }
  };

  const fetchEarnings = async () => {
    try {
      const data = await consultantsApi.getConsultantEarnings('monthly');
      setEarnings(data || []);
    } catch (error: any) {
      // 404 means no consultant profile yet - show empty state
      if (error.response?.status !== 404) {
        console.error('Failed to fetch earnings:', error);
      }
      setEarnings([]);
    }
  };

  const fetchReviews = async () => {
    try {
      // For now, we'll use profile data for reviews
      if (profile) {
        const mockReviews = {
          averageRating: profile.rating || 0,
          totalReviews: profile.total_reviews || 0,
          recentReviews: [] // This would come from a separate reviews API
        };
        setReviews(mockReviews);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      // For now, we'll use booking-related notifications
      const upcomingBookings = await consultantsApi.getConsultantBookings();
      const notifications = upcomingBookings.map((booking: any) => ({
        type: 'booking',
        message: `New booking from ${booking.user?.name || booking.user?.email || 'Client'}`,
        time: booking.createdAt || booking.created_at || new Date().toISOString(),
        bookingId: booking.id
      }));
      setNotifications(notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  };

  const fetchMessages = async () => {
    try {
      // Get messages from all recent bookings
      const upcomingBookings = await consultantsApi.getConsultantBookings();
      const allMessages = [];
      
      for (const booking of upcomingBookings) {
        if (booking.id) {
          try {
            const bookingMessages = await bookings.getMessages(booking.id);
            // Add booking and client info to each message
            const messagesWithClient = (bookingMessages || []).map((msg: any) => ({
              ...msg,
              bookingId: booking.id,
              client: booking.user?.name || booking.user?.email || 'Client',
              clientId: booking.userId,
              time: msg.created_at
            }));
            allMessages.push(...messagesWithClient);
          } catch (error) {
            console.error(`Failed to fetch messages for booking ${booking.id}:`, error);
          }
        }
      }
      
      // Sort by most recent and take last 5
      const sortedMessages = allMessages
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5);
      
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    }
  };

  const fetchAvailability = async () => {
    try {
      const data = await consultantsApi.getConsultantAvailability();
      setAvailability(data || []);
    } catch (error: any) {
      // 404 means no consultant profile yet - show empty state
      if (error.response?.status !== 404) {
        console.error('Failed to fetch availability:', error);
      }
      setAvailability([]);
    }
  };

  const fetchPerformanceMetrics = async () => {
    try {
      const data = await consultantsApi.getDashboardStats();
      setPerformanceMetrics(data);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    }
  };

  const handleSessionAction = async (sessionId: number, action: 'accept' | 'reject' | 'join') => {
    try {
      if (action === 'join') {
        // Navigate to session or open video call
        navigate(`/session/${sessionId}`);
      } else {
        await bookings.updateStatus(sessionId, action as 'ACCEPTED' | 'REJECTED' | 'CANCELLED');
        addToast(`Session ${action}ed successfully`, 'success');
        fetchUpcomingSessions(); // Refresh sessions
      }
    } catch (error) {
      addToast(`Failed to ${action} session`, 'error');
    }
  };

  const handleWithdraw = async () => {
    try {
      // This would call a withdrawal API endpoint
      addToast('Withdrawal request submitted successfully', 'success');
      fetchEarnings(); // Refresh earnings
    } catch (error) {
      addToast('Failed to submit withdrawal request', 'error');
    }
  };

  const handleWalletRecharge = async (amount: number, bonus: number) => {
    console.log(" Recharging wallet:", amount);
    try {
      const res = await loadRazorpayScript();
      if (!res) throw new Error("Razorpay SDK failed to load. Are you online?");

      // Create order for wallet recharge
      const orderData = await payments.createOrder(amount);

      // Fetch user profile
      let userName = "Consultant";
      let userEmail = "consultant@example.com";
      try {
        if (user?.name) userName = user.name;
        if (user?.email) userEmail = user.email;
      } catch (e) {
        // fail silently
      }

      // Init Razorpay
      const options = {
        key: orderData.key_id,
        amount: orderData.amount * 100,
        currency: "INR",
        name: "Wallet Recharge",
        description: `Recharge wallet with ₹${amount} + ₹${bonus} bonus`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            await payments.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount,
              userType: "CONSULTANT",
            });
            addToast(`Wallet recharged successfully!`, 'success');
          } catch (err: any) {
            addToast(`Payment verification failed: ${err.message}`, 'error');
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
      addToast(`Wallet recharge failed: ${error.response?.data?.error || error.message}`, 'error');
    }
  };

  const formatTime = (timeString: string) => {
  const date = new Date(timeString);
  return date.toLocaleString();
};

const calculateProfileCompletion = () => {
  if (!profile) return 0;
  
  // Required fields (weight: 60%)
  const requiredFields = [
    profile.name,
    profile.domain,
    profile.hourly_price,
    profile.bio,
    profile.languages
  ];
  
  // Optional fields (weight: 40%)
  const optionalFields = [
    onboardingData.designation,
    onboardingData.years_experience,
    onboardingData.education,
    onboardingData.linkedin,
    onboardingData.other_social,
    onboardingData.availability !== 'Flexible',
    profilePhoto
  ];
  
  const completedRequired = requiredFields.filter(field => field && field?.toString()?.trim() !== '').length;
  const completedOptional = optionalFields.filter(field => field && field?.toString()?.trim() !== '').length;
  
  // Weighted calculation: 60% for required, 40% for optional
  const requiredScore = (completedRequired / requiredFields.length) * 60;
  const optionalScore = (completedOptional / optionalFields.length) * 40;
  
  return Math.round(requiredScore + optionalScore);
};

const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all mandatory fields
    const requiredFields = [
      { field: 'domain', label: 'Domain' },
      { field: 'hourly_price', label: 'Hourly Price' },
      { field: 'bio', label: 'Bio' },
      { field: 'languages', label: 'Languages' },
      { field: 'designation', label: 'Designation' },
      { field: 'years_experience', label: 'Years of Experience' },
      { field: 'education', label: 'Education' },
      { field: 'availability', label: 'Availability' }
    ];

    const missingFields = requiredFields.filter(({ field }) => {
      const value = onboardingData[field as keyof typeof onboardingData];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      addToast(`All fields are mandatory. Missing: ${missingFields.map(f => f.label).join(', ')}`, "error");
      return;
    }

    // Validate numeric fields
    const hourlyPrice = parseFloat(onboardingData.hourly_price);
    const yearsExp = parseInt(onboardingData.years_experience);

    if (isNaN(hourlyPrice) || hourlyPrice <= 0) {
      addToast("Hourly price must be a positive number", "error");
      return;
    }

    if (isNaN(yearsExp) || yearsExp < 0) {
      addToast("Years of experience must be a non-negative number", "error");
      return;
    }

    try {
      // Upload profile photo if exists
      let profilePicUrl = onboardingData.profile_pic;
      if (profilePhoto && !profilePicUrl) {
        try {
          // Convert base64 to File
          const response = await fetch(profilePhoto);
          const blob = await response.blob();
          const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
          
          const uploadResponse = await consultantsApi.uploadProfilePic(file);
          profilePicUrl = uploadResponse.profile_pic;
        } catch (uploadError) {
          console.error('Profile photo upload failed:', uploadError);
          addToast('Profile photo upload failed, but registration will continue', 'warning');
        }
      }

      // Prepare registration data with all mandatory fields
      const registrationData = {
        type: onboardingData.type,
        domain: onboardingData.domain,
        bio: onboardingData.bio,
        languages: onboardingData.languages,
        hourly_price: hourlyPrice.toString(),
        designation: onboardingData.designation,
        years_experience: yearsExp.toString(),
        education: onboardingData.education,
        availability: onboardingData.availability,
        linkedin: onboardingData.linkedin,
        other_social: onboardingData.other_social,
        profile_pic: profilePicUrl,
      };

      await consultantsApi.register(registrationData);

      // Show registration fee notification
      const registrationFee = 10;
      const finalHourlyPrice = hourlyPrice - registrationFee;
      
      setShowRegistrationFee(true);
      setRegistrationFeeDeducted(true);

      addToast("Consultant profile created successfully!", "success");
      
      // Refresh profile data
      fetchProfile();
      
    } catch (error: any) {
      console.error("Registration error:", error);
      addToast(error.response?.data?.error || "Failed to create consultant profile", "error");
      setProfile(null);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Expert Portal">
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  const isProfileIncomplete = !profile || 
    !profile.name || 
    !profile.domain || 
    !profile.hourly_price || 
    !profile.bio || 
    !profile.languages;

  if (isProfileIncomplete) {
    return (
      <Layout title="Expert Registration">
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <Users size={32} className="mx-auto text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold">
                {!profile ? 'Complete Your Profile' : 'Update Your Profile'}
              </h2>
              {!profile && (
                <p className="text-gray-600 mt-2">Please complete your profile to access dashboard</p>
              )}
              {profile && isProfileIncomplete && (
                <p className="text-orange-600 mt-2">Please complete all required fields to access full dashboard</p>
              )}
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-100 shadow-md bg-gray-100 flex items-center justify-center">
                  {profilePhoto || onboardingData.profile_pic ? (
                    <img
                      src={profilePhoto || onboardingData.profile_pic}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-gray-400">
                      {onboardingData.domain?.charAt(0) || "C"}
                    </span>
                  )}
                </div>

                <label className="mt-3 text-sm text-blue-600 font-semibold cursor-pointer">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
              <input
                type="text"
                placeholder="Domain (e.g. Tech)"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.domain}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    domain: e.target.value,
                  })
                }
                required
              />

              <input
                type="number"
                placeholder="Hourly Rate"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.hourly_price}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    hourly_price: e.target.value,
                  })
                }
                required
              />
              
              {onboardingData.hourly_price && !registrationFeeDeducted && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-semibold text-blue-900">Registration Fee Calculation</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Your Hourly Rate:</span>
                      <span className="text-lg font-bold text-gray-900">₹{parseFloat(onboardingData.hourly_price).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Registration Fee:</span>
                      <span className="text-lg font-bold text-red-600">-₹10.00</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">You'll Receive:</span>
                        <span className="text-xl font-bold text-green-600">₹{(parseFloat(onboardingData.hourly_price) - 10).toFixed(2)}/hr</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-3">
                    One-time registration fee of ₹10 will be deducted from your hourly rate
                  </p>
                </div>
              )}
            
            {registrationFeeDeducted && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-900">
                      Registration fee of ₹10 has been deducted
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Your Hourly Rate:</span>
                    <span className="text-lg font-bold text-gray-900">₹{parseFloat(onboardingData.hourly_price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Registration Fee:</span>
                    <span className="text-lg font-bold text-red-600">-₹10.00</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">You'll Receive:</span>
                      <span className="text-xl font-bold text-green-600">₹{(parseFloat(onboardingData.hourly_price) - 10).toFixed(2)}/hr</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-700">
                  One-time registration fee of ₹10 will be deducted from your hourly rate
                </p>
              </div>
            )}
            
            <textarea
              placeholder="Bio"
              className="w-full border rounded-xl px-4 py-3 h-32"
              value={onboardingData.bio}
              onChange={(e) =>
                setOnboardingData({
                  ...onboardingData,
                  bio: e.target.value,
                })
              }
              required
            />
            
            <input
              type="text"
              placeholder="Languages (comma separated)"
              className="w-full border rounded-xl px-4 py-3"
              value={onboardingData.languages}
              onChange={(e) =>
                setOnboardingData({
                  ...onboardingData,
                  languages: e.target.value,
                })
              }
              required
            />
            
            <input
              type="text"
              placeholder="Designation"
              className="w-full border rounded-xl px-4 py-3"
              value={onboardingData.designation}
              onChange={(e) =>
                setOnboardingData({
                  ...onboardingData,
                  designation: e.target.value,
                })
              }
              required
            />
            
            <input
              type="number"
              placeholder="Years of Experience"
              className="w-full border rounded-xl px-4 py-3"
              value={onboardingData.years_experience}
              onChange={(e) =>
                setOnboardingData({
                  ...onboardingData,
                  years_experience: e.target.value,
                })
              }
              required
            />
            
            <input
              type="text"
              placeholder="Education"
              className="w-full border rounded-xl px-4 py-3"
              value={onboardingData.education}
              onChange={(e) =>
                setOnboardingData({
                  ...onboardingData,
                  education: e.target.value,
                })
              }
              required
            />
            
            <select
              className="w-full p-3 border border-gray-300 rounded-xl"
              value={onboardingData.availability}
              onChange={(e) =>
                setOnboardingData({
                  ...onboardingData,
                  availability: e.target.value,
                })
              }
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Flexible</option>
              <option>Weekends</option>
            </select>
            
            <input
              type="url"
              placeholder="LinkedIn URL (optional)"
              className="w-full border rounded-xl px-4 py-3"
              value={onboardingData.linkedin}
              onChange={(e) =>
                setOnboardingData({
                  ...onboardingData,
                  linkedin: e.target.value,
                })
              }
            />
            
            <input
              type="url"
              placeholder="Website / Portfolio URL (optional)"
              className="w-full border rounded-xl px-4 py-3"
              value={onboardingData.other_social}
              onChange={(e) =>
                setOnboardingData({
                  ...onboardingData,
                  other_social: e.target.value,
                })
              }
            />

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl"
            >
              {!profile ? 'Create Profile' : 'Update Profile'}
            </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  // 🟢 DASHBOARD VIEW
  return (
    <Layout title="Expert Portal">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Registration Fee Notification */}
        {showRegistrationFee && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-yellow-900">Registration Fee Deducted</p>
                <p className="text-sm text-yellow-800">
                  ₹10 has been deducted from your hourly rate as registration fee
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRegistrationFee(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Live Session Banner */}
        {liveSession && (
          <div 
            onClick={() => navigate('/consultant/messages', { state: { bookingId: liveSession.id } })}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-full p-2 mr-3 animate-pulse">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-lg flex items-center">
                  🔴 Live Session Active
                  <span className="ml-2 text-xs bg-white/30 px-2 py-1 rounded-full">NOW</span>
                </p>
                <p className="text-sm text-white/90">
                  Session with {liveSession.user?.name || 'Client'} • {liveSession.time_slot} • Click to join chat
                </p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
        )}

        {/* 4.1 Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                {getGreeting()}, {profile?.name || user?.name || "Expert"}!
              </h2>
              
              <div className="flex items-center space-x-4 mb-4 flex-wrap gap-2">
                <div className="flex items-center">
                  {profile?.is_verified ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Pending
                    </span>
                  )}
                </div>
                
                {/* Plan Badge */}
                {profile?.currentPlan && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    profile.currentPlan === 'Elite' ? 'bg-purple-100 text-purple-800' :
                    profile.currentPlan === 'Premium' ? 'bg-blue-100 text-blue-800' :
                    profile.currentPlan === 'Professional' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    <Crown className="w-3 h-3 mr-1" />
                    {profile.currentPlan} Plan
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">Profile Completion</p>
                  <p className="text-2xl font-bold">{calculateProfileCompletion()}%</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Domain</p>
                  <p className="text-xl font-semibold">{profile?.domain}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Hourly Rate</p>
                  <p className="text-xl font-semibold">₹{profile?.hourly_price || "--"}/hr</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Experience</p>
                  <p className="text-xl font-semibold">{profile?.years_experience || "0"} years</p>
                </div>
              </div>
            </div>
            
            {profile?.profile_pic && (
              <img
                src={profile.profile_pic}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-white/20 object-cover"
              />
            )}
          </div>
        </div>

 

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 4.2 Upcoming Sessions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Upcoming Sessions
                </h3>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No upcoming sessions</p>
                  </div>
                ) : (
                  upcomingSessions.map((session) => (
                    <div key={session.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{session.user?.name || session.user?.email || 'Client'}</h4>
                              <p className="text-sm text-gray-600">{session.domain || 'Consultation'}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 ml-13">
                            <Clock className="w-4 h-4 mr-1" />
                            {session.date ? new Date(session.date).toLocaleDateString('en-IN') : 'Date not set'} at {session.time_slot || 'Time not set'}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            session.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800'
                              : session.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status || 'Unknown'}
                          </span>
                          
                          {session.status === 'confirmed' ? (
                            <button 
                              onClick={() => handleSessionAction(session.id, 'join')}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              title="Join Session"
                            >
                              <Video className="w-4 h-4" />
                            </button>
                          ) : session.status === 'pending' ? (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleSessionAction(session.id, 'accept')}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                title="Accept Session"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleSessionAction(session.id, 'reject')}
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                title="Reject Session"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4.3 Availability Overview */}
          <div>
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-green-600" />
                  Availability
                </h3>
                <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {availability ? (
                  <>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-green-900 mb-2">Next Available</p>
                      <p className="text-lg font-bold text-green-700">
                        {availability.nextAvailable ? formatTime(availability.nextAvailable) : 'No upcoming slots'}
                      </p>
                    </div>
                    
                    {availability.weeklySchedule && availability.weeklySchedule.length > 0 ? (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-sm font-medium text-blue-900 mb-2">This Week</p>
                        <div className="space-y-1">
                          {availability.weeklySchedule.map((slot: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{slot.day}</span>
                              <span className="font-medium">{slot.timeRange}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm font-medium text-gray-900">No weekly schedule set</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Loading availability...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Subscription Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Current Subscription</h2>
              {profile?.currentPlan && profile.currentPlan !== 'Free' ? (
                <>
                  <p className="text-4xl font-bold mb-2">{profile.currentPlan}</p>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full inline-block mb-4">
                    <span className="font-semibold">Status: {profile.subscriptionStatus || 'Active'}</span>
                  </div>
                  {profile.subscriptionEndDate && (
                    <p className="text-sm opacity-90">
                      Expires: {new Date(profile.subscriptionEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold mb-2">Free Plan</p>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                    <span className="font-semibold">Limited Features</span>
                  </div>
                  <p className="text-sm opacity-90 mt-4">
                    Upgrade to unlock premium features
                  </p>
                </>
              )}
            </div>
            <button 
              onClick={() => navigate('/consultant/plans')}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              {profile?.currentPlan && profile.currentPlan !== 'Free' ? 'Upgrade Plan' : 'View Plans'}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Subscription Usage Section */}
        <div className="bg-white rounded-3xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Subscription Usage</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Monthly Chat Messages */}
            <div className="bg-blue-50 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-lg font-semibold text-blue-800 mb-2">Monthly Chat Messages</p>
                <p className="text-3xl font-bold text-blue-600">{usage?.chat_messages_used || 0} <span className="text-base font-medium text-gray-500">Used</span></p>
                <p className="text-sm text-gray-500 mt-1">{usage?.chat_limit || 5} Total</p>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-4">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min((usage?.chat_messages_used || 0) / (usage?.chat_limit || 5) * 100, 100)}%` }}></div>
              </div>
            </div>
            
            {/* Bookings Made */}
            <div className="bg-purple-50 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-lg font-semibold text-purple-800 mb-2">Bookings Made</p>
                <p className="text-3xl font-bold text-purple-600">{usage?.bookings_made || 0} <span className="text-base font-medium text-gray-500">Used</span></p>
                <p className="text-sm text-gray-500 mt-1">No limit</p>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-4">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            {/* Days Remaining */}
            <div className="bg-green-50 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-lg font-semibold text-green-800 mb-2">Days Remaining</p>
                <p className="text-3xl font-bold text-green-600">{usage?.days_remaining || 0} <span className="text-base font-medium text-gray-500">Days</span></p>
                <p className="text-sm text-gray-500 mt-1">{usage?.days_remaining > 0 ? 'Until renewal' : 'Expired'}</p>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2 mt-4">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.max((usage?.days_remaining || 0) / 30 * 100, 0)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 4.4 Earnings Summary */}
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Earnings Summary
              </h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Transactions
              </button>
            </div>
            
            {earnings ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">₹{(earnings.totalEarnings || 0).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Monthly Earnings</p>
                  <p className="text-2xl font-bold text-blue-600">₹{(earnings.monthlyEarnings || 0).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Pending Payout</p>
                  <p className="text-2xl font-bold text-yellow-600">₹{(earnings.pendingPayout || 0).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Withdrawable</p>
                  <p className="text-2xl font-bold text-purple-600">₹{(earnings.withdrawableBalance || 0).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No earnings data available</p>
              </div>
            )}
            
            <div className="flex space-x-4 mt-6">
              <button 
                onClick={handleWithdraw}
                disabled={!earnings || earnings.withdrawableBalance <= 0}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Withdraw
              </button>
              <button 
                onClick={() => navigate('/earnings')}
                className="flex-1 border border-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50"
              >
                View Detailed Report
              </button>
            </div>
          </div>

          {/* 4.5 Reviews & Ratings */}
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Reviews & Ratings
              </h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            
            {reviews ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-8 h-8 text-yellow-500 fill-current" />
                    <span className="text-3xl font-bold ml-2">{reviews.averageRating || 0}</span>
                  </div>
                  <p className="text-gray-600">{reviews.totalReviews || 0} Total Reviews</p>
                </div>
                
                {reviews.recentReviews && reviews.recentReviews.length > 0 ? (
                  <div className="border-t pt-4">
                    <p className="font-medium mb-3">Recent Reviews</p>
                    <div className="space-y-3">
                      {reviews.recentReviews.map((review: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{review.client || 'Anonymous'}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < (review.rating || 0)
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{review.comment || 'No comment provided'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4 text-center text-gray-500">
                    <p>No recent reviews</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No reviews data available</p>
              </div>
            )}
          </div>

          {/* 4.6 Performance Metrics */}
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                Performance Metrics
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {performanceMetrics ? (
                <>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{performanceMetrics.sessionsCompleted || 0}</p>
                    <p className="text-sm text-blue-900">Sessions Completed</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{performanceMetrics.successRate || 0}%</p>
                    <p className="text-sm text-green-900">Success Rate</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{performanceMetrics.rebookingRate || 0}%</p>
                    <p className="text-sm text-purple-900">Rebooking Rate</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">{performanceMetrics.profileViews || 0}</p>
                    <p className="text-sm text-orange-900">Profile Views</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">-</p>
                    <p className="text-sm text-blue-900">Sessions Completed</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">-</p>
                    <p className="text-sm text-green-900">Success Rate</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">-</p>
                    <p className="text-sm text-purple-900">Rebooking Rate</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">-</p>
                    <p className="text-sm text-orange-900">Profile Views</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 4.7 Notifications Summary */}
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center">
                <Bell className="w-5 h-5 mr-2 text-red-600" />
                Notifications
              </h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div key={index} className="flex items-start p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                      notification.type === 'booking' ? 'bg-blue-600' :
                      notification.type === 'verification' ? 'bg-green-600' :
                      notification.type === 'payment' ? 'bg-purple-600' :
                      'bg-gray-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.message || 'Notification'}</p>
                      <p className="text-xs text-gray-500">{notification.time ? formatTime(notification.time) : 'Just now'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4.8 Messages Preview */}
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
                Messages
              </h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div 
                    key={index} 
                    className="flex items-start p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => navigate('/consultant/messages', { state: { bookingId: message.bookingId } })}
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{message.client}</span>
                        {message.unread && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{message.content || 'No message'}</p>
                      <p className="text-xs text-gray-500">{message.time ? formatTime(message.time) : 'Unknown time'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>


      </div>
    </Layout>
  );
};

export default ConsultantDashboard;