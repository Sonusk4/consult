import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { consultants as consultantsApi, subscriptions, bookings } from "../services/api";
import { Consultant } from "../types";
import { Loader, Users, Calendar, DollarSign, Star, MessageSquare, TrendingUp, Bell, Clock, CheckCircle, XCircle, AlertCircle, Video, Edit, Trash2, Plus, ArrowRight, Eye, Check } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../App";

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

const ConsultantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [showRegistrationFee, setShowRegistrationFee] = useState(false);
  const [registrationFeeDeducted, setRegistrationFeeDeducted] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [reviews, setReviews] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState({

    domain: "",
    hourly_price: "",
    bio: "",
    languages: "",

    // Frontend-only fields
    designation: "",
    years_experience: "",
    education: "",
    availability: "Flexible",

    linkedin: "",
    other_social: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("consultant_extra");
    if (saved) {
      const parsed = JSON.parse(saved);
      setOnboardingData(parsed);
      setRegistrationFeeDeducted(parsed.registrationFeeDeducted || false);
    }
    
    // Also load profile photo from main user object (like ProfilePage)
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userObj = JSON.parse(userStr);
      setProfilePhoto(userObj.avatar || null);
    }
  }, []);

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

  useEffect(() => {
    if (profile) {
      setOnboardingData(prev => ({
        ...prev,
        domain: profile.domain || prev.domain,
        hourly_price: profile.hourly_price?.toString() || prev.hourly_price,
        bio: profile.bio || prev.bio,
        languages: profile.languages || prev.languages,
        designation: prev.designation,
        years_experience: prev.years_experience,
        education: prev.education,
        availability: prev.availability,
        linkedin: prev.linkedin,
        other_social: prev.other_social,
      }));
    }
  }, [profile]);

  const fetchUsage = async () => {
    try {
      const data = await subscriptions.getUsageMetrics();
      setUsage(data);
    } catch (error) {
      console.error('Failed to fetch usage metrics:', error);
    }
  };

  const fetchUpcomingSessions = async () => {
    try {
      const data = await consultantsApi.getConsultantBookings();
      setUpcomingSessions(data || []);
    } catch (error) {
      console.error('Failed to fetch upcoming sessions:', error);
      setUpcomingSessions([]);
    }
  };

  const fetchEarnings = async () => {
    try {
      const data = await consultantsApi.getConsultantEarnings('monthly');
      setEarnings(data);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
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
        message: `New booking from ${booking.clientName || 'Client'}`,
        time: booking.createdAt || new Date().toISOString(),
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
            allMessages.push(...(bookingMessages || []));
          } catch (error) {
            console.error(`Failed to fetch messages for booking ${booking.id}:`, error);
          }
        }
      }
      
      setMessages(allMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    }
  };

  const fetchAvailability = async () => {
    try {
      const data = await consultantsApi.getConsultantAvailability();
      setAvailability(data);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
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

    if (!onboardingData.domain || !onboardingData.hourly_price) {
      addToast("Domain and Hourly Price required", "error");
      return;
    }

    try {
      // 🔥 Remove frontend-only fields before sending
      const {
        designation,
        years_experience,
        education,
        availability,
        linkedin,
        other_social,


        ...backendData
      } = onboardingData;

      await consultantsApi.register(backendData);

      // Show registration fee notification
      const hourlyPrice = parseFloat(onboardingData.hourly_price);
      const registrationFee = 10;
      const finalHourlyPrice = hourlyPrice - registrationFee;
      
      setShowRegistrationFee(true);
      setRegistrationFeeDeducted(true);

      // Save frontend-only fields locally
      localStorage.setItem(
        "consultant_extra",
        JSON.stringify({
          designation,
          years_experience,
          education,
          availability,
          linkedin,
          other_social,
          profilePhoto,
          registrationFeeDeducted: true,
        })
      );

      addToast("Profile created! Registration fee of ₹10 deducted.", "success");
      fetchProfile();
    } catch {
      addToast("Failed to create profile", "error");
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await consultantsApi.getProfile();
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
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
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
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
                    💡 One-time registration fee of ₹10 will be deducted from your hourly rate
                  </p>
                </div>
              )}
              
              {registrationFeeDeducted && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-900">
                      Registration fee of ₹10 has been deducted
                    </span>
                  </div>
                </div>
              )}

              <textarea
                placeholder="Bio"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.bio}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    bio: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Languages"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.languages}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    languages: e.target.value,
                  })
                }
              />

              {/* 🔥 FRONTEND ONLY FIELDS */}

              <input
                type="text"
                placeholder="Designation (Frontend only)"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.designation}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    designation: e.target.value,
                  })
                }
              />

              <input
                type="number"
                placeholder="Years of Experience (Frontend only)"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.years_experience}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    years_experience: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Education (Frontend only)"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.education}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    education: e.target.value,
                  })
                }
              />

              <input
                type="url"
                placeholder="LinkedIn Profile (Frontend only)"
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
                placeholder="Other Social Media (Instagram / Twitter / Website)"
                className="w-full border rounded-xl px-4 py-3"
                value={onboardingData.other_social}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    other_social: e.target.value,
                  })
                }
              />

              <select
                className="w-full border rounded-xl px-4 py-3"
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

        {/* 4.1 Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative">
          {/* Prominent Badge - Top Right Corner */}
          <div className="absolute top-4 right-4 z-10">
            {usage?.plan === "Professional" && (
              <div className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg border-2 border-blue-300">
                <div className="flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  <span className="font-bold text-sm">Professional</span>
                </div>
              </div>
            )}
            {usage?.plan === "Premium" && (
              <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg border-2 border-green-300">
                <div className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  <span className="font-bold text-sm">Premium</span>
                </div>
              </div>
            )}
            {usage?.plan === "Elite" && (
              <div className="bg-purple-500 text-white px-4 py-2 rounded-full shadow-lg border-2 border-purple-300">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  <span className="font-bold text-sm">Elite</span>
                </div>
              </div>
            )}
            {(!usage?.plan || usage?.plan === "Free") && (
              <div className="bg-gray-500 text-white px-4 py-2 rounded-full shadow-lg border-2 border-gray-300">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  <span className="font-bold text-sm">Free</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                {getGreeting()}, {profile.name || user?.name || "Expert"}!
              </h2>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {profile.is_verified ? (
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
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">Profile Completion</p>
                  <p className="text-2xl font-bold">{calculateProfileCompletion()}%</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Domain</p>
                  <p className="text-xl font-semibold">{profile.domain}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Hourly Rate</p>
                  <p className="text-xl font-semibold">₹{profile.hourly_price}/hr</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Experience</p>
                  <p className="text-xl font-semibold">{onboardingData.years_experience || "0"} years</p>
                </div>
              </div>
            </div>
            
            {profilePhoto && (
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-white/20"
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
                              <h4 className="font-semibold">{session.clientName}</h4>
                              <p className="text-sm text-gray-600">{session.sessionType}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 ml-13">
                            <Clock className="w-4 h-4 mr-1" />
                            {session.date ? formatTime(session.date) : 'Date not set'} at {session.time || 'Time not set'}
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
                    onClick={() => navigate(`/messages/${message.clientId || message.id}`)}
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{message.client || 'Unknown Client'}</span>
                        {message.unread && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{message.message || 'No message'}</p>
                      <p className="text-xs text-gray-500">{message.time ? formatTime(message.time) : 'Unknown time'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= USAGE LIMITS ================= */}
        {usage && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border">
            <h2 className="text-2xl font-bold mb-6">Subscription Usage</h2>
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex-1 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">Monthly Chat Messages</h3>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span>{usage.chat_messages_used} Used</span>
                  <span>{usage.chat_limit} Total</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usage.chat_messages_used / usage.chat_limit) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex-1 bg-green-50 p-6 rounded-2xl border border-green-100">
                <h3 className="font-semibold text-green-900 mb-2">Days Remaining</h3>
                <div className="text-3xl font-bold text-green-700">
                  {usage.days_remaining}
                </div>
                <p className="text-sm text-green-800 mt-1">days left on {usage.plan} plan</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default ConsultantDashboard;