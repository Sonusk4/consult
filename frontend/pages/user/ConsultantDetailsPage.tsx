import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { consultants as consultantsApi, bookings } from '../../services/api';
import api from '../../services/api';
import { Consultant } from '../../types';
import { Star, Calendar, Clock,  ArrowLeft, Video, MessageCircle, Loader, AlertTriangle, CreditCard, CheckCircle, X, Wallet, Linkedin, Globe, IndianRupee } from 'lucide-react';
import UserPopupModal from '../../components/UserPopupModal';
import { useUserPopup } from '../../hooks/useUserPopup';

interface TimeSlot {
  id: number;
  available_time: string;
  is_booked: boolean;
}

/* ==================== INSUFFICIENT BALANCE MODAL ==================== */
const InsufficientBalanceModal: React.FC<{
  required: number;
  current: number;
  onClose: () => void;
  onAddCredits: () => void;
}> = ({ required, current, onClose, onAddCredits }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white text-center">
        <div className="flex justify-center mb-3">
          <div className="bg-white/20 rounded-full p-3">
            <AlertTriangle size={32} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Insufficient Balance</h2>
        <p className="text-red-100 mt-1 text-sm">You don't have enough credits for this booking</p>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Your Current Balance</span>
            <span className="font-bold text-gray-800">₹{current.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Amount Required</span>
            <span className="font-bold text-red-600">₹{required.toFixed(2)}</span>
          </div>
          <div className="border-t border-red-100 pt-3 flex justify-between items-center">
            <span className="text-gray-700 font-medium text-sm">Short By</span>
            <span className="font-bold text-red-700 text-lg">₹{(required - current).toFixed(2)}</span>
          </div>
        </div>

        <p className="text-gray-500 text-sm text-center">
          Add credits to your wallet to book this consultation.
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={onAddCredits}
          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
        >
          <CreditCard size={18} />
          Add Credits
        </button>
      </div>
    </div>
  </div>
);

/* ==================== BOOKING CONFIRMATION MODAL ==================== */
const BookingConfirmationModal: React.FC<{
  consultantName: string;
  domain: string;
  bio?: string;
  date: string;
  timeSlot: string;
  fee: number;
  walletBalance: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ consultantName, domain, bio, date, timeSlot, fee, walletBalance, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">Confirm Booking</h2>
            <p className="text-blue-100 text-sm mt-1">Review the details before confirming</p>
          </div>
          <button onClick={onCancel} className="text-white/70 hover:text-white transition">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Consultant info */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Consultant</span>
            <span className="font-semibold text-gray-800">{consultantName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Domain</span>
            <span className="font-semibold text-blue-600">{domain}</span>
          </div>
          {bio && (
            <div className="pt-2 border-t border-gray-200">
              <div className="text-sm">
                <span className="text-gray-500 block mb-1">About</span>
                <p className="text-gray-700 text-xs leading-relaxed line-clamp-3">{bio}</p>
              </div>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="font-semibold text-gray-800">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Time Slot</span>
            <span className="font-semibold text-gray-800">{timeSlot}</span>
          </div>
        </div>

        {/* Payment info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={16} />
            <span className="font-semibold text-sm">Payment Summary</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Consultation Fee</span>
            <span className="font-bold text-gray-800 text-lg">₹{fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm flex items-center gap-1">
              <Wallet size={14} />
              Current Balance
            </span>
            <span className="font-semibold text-gray-700">₹{walletBalance.toFixed(2)}</span>
          </div>
          <div className="border-t border-amber-200 pt-3 flex justify-between items-center">
            <span className="text-gray-700 font-medium text-sm">Balance After Booking</span>
            <span className={`font-bold text-base ${walletBalance - fee < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{(walletBalance - fee).toFixed(2)}
            </span>
          </div>
        </div>

        <p className="text-gray-400 text-xs text-center">
          ₹{fee.toFixed(2)} will be deducted from your wallet upon confirmation.
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <><Loader size={18} className="animate-spin" /> Processing...</>
          ) : (
            <><CheckCircle size={18} /> Confirm & Book</>
          )}
        </button>
      </div>
    </div>
  </div>
);

/* ==================== SUCCESS MODAL ==================== */
const BookingSuccessModal: React.FC<{
  consultantName: string;
  date: string;
  timeSlot: string;
  fee: number;
  remainingBalance: number;
  onClose: () => void;
}> = ({ consultantName, date, timeSlot, fee, remainingBalance, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
        <div className="flex justify-center mb-3">
          <div className="bg-white/20 rounded-full p-3">
            <CheckCircle size={32} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
        <p className="text-green-100 mt-1 text-sm">Your consultation has been booked successfully</p>
      </div>

      <div className="p-6 space-y-3">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Consultant</span>
            <span className="font-semibold">{consultantName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-semibold">{new Date(date).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span className="font-semibold">{timeSlot}</span>
          </div>
          <div className="flex justify-between border-t border-green-100 pt-2 mt-2">
            <span className="text-gray-500">Amount Deducted</span>
            <span className="font-bold text-red-600">-₹{fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">New Balance</span>
            <span className="font-bold text-green-600">₹{remainingBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition"
        >
          Done
        </button>
      </div>
    </div>
  </div>
);

/* ==================== MAIN COMPONENT ==================== */
const ConsultantDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const { showError, showSuccess, popup, hidePopup } = useUserPopup();

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [insufficientData, setInsufficientData] = useState({ required: 0, current: 0 });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [lastBookingResult, setLastBookingResult] = useState<{ fee: number; remainingBalance: number } | null>(null);

  useEffect(() => {
    if (id) fetchConsultantDetails();
    fetchWalletBalance();
  }, [id]);

  useEffect(() => {
    if (bookingDate && id) fetchAvailableSlots();
  }, [bookingDate, id]);

  const fetchWalletBalance = async () => {
    try {
      const res = await api.get('/wallet');
      setWalletBalance(res.data.balance || 0);
    } catch {
      // fail silently
    }
  };

  const fetchConsultantDetails = async () => {
    try {
      const data = await consultantsApi.getById(id!);
      setConsultant(data);
    } catch (error) {
      console.error('Failed to fetch consultant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!bookingDate) return;
    setLoadingSlots(true);
    try {
      const response = await fetch(`http://localhost:5000/consultants/${id}/availability?date=${bookingDate}`);
      const slots = await response.json();
      setAvailableSlots(slots);
      setSelectedSlot('');
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Step 1: User clicks "Book" → show confirmation modal
  const handleBookClick = () => {
    if (!bookingDate || !selectedSlot) return;
    setShowConfirmModal(true);
  };

  // Step 2: User confirms → call API
  const handleConfirmBooking = async () => {
    if (!bookingDate || !selectedSlot || !consultant) return;
    setBookingLoading(true);

    try {
      const result = await bookings.create({
        consultant_id: parseInt(id!),
        date: bookingDate,
        time_slot: selectedSlot,
      });

      // Also mark the slot as booked via slot-book endpoint
      try {
        await api.post('/bookings/slot-book', {
          consultant_id: parseInt(id!),
          date: bookingDate,
          time_slot: selectedSlot,
        });
      } catch {
        // slot marking is a best-effort side effect, ignore error
      }

      setLastBookingResult({
        fee: consultant.hourly_price || 0,
        remainingBalance: result.remaining_balance ?? (walletBalance - (consultant.hourly_price || 0)),
      });

      setShowConfirmModal(false);
      setShowSuccessModal(true);
      setBookingDate('');
      setSelectedSlot('');
      setAvailableSlots([]);
      // Refresh wallet balance
      await fetchWalletBalance();
    } catch (error: any) {
      setShowConfirmModal(false);
      const errData = error?.response?.data;
      if (error?.response?.status === 400 && errData?.error === 'Insufficient balance') {
        setInsufficientData({
          required: errData.required || consultant?.hourly_price || 0,
          current: errData.current || walletBalance,
        });
        setShowInsufficientModal(true);
      } else {
        showError('Booking Failed', errData?.error || 'Failed to send booking request. Please try again.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!consultant) {
    return (
      <Layout title="Consultant Not Found">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Consultant Not Found</h2>
            <button
              onClick={() => navigate('/search')}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700"
            >
              Back to Search
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Guard clause - don't render if consultant data is not available
  if (!consultant) {
    return (
      <Layout title="Consultant Not Found">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Consultant Not Found</h2>
            <p className="text-gray-600 mb-6">The consultant you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Back to Search
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${consultant.user?.name || consultant.name || 'Unknown Consultant'} - Consultant Details`}>
      {/* Modals */}
      {showConfirmModal && (
        <BookingConfirmationModal
          consultantName={consultant.user?.name || consultant.name || 'Unknown'}
          domain={consultant.domain || ''}
          bio={consultant.user?.profile?.bio}
          date={bookingDate}
          timeSlot={selectedSlot}
          fee={consultant.hourly_price || 0}
          walletBalance={walletBalance}
          onConfirm={handleConfirmBooking}
          onCancel={() => setShowConfirmModal(false)}
          loading={bookingLoading}
        />
      )}

      {showInsufficientModal && (
        <InsufficientBalanceModal
          required={insufficientData.required}
          current={insufficientData.current}
          onClose={() => setShowInsufficientModal(false)}
          onAddCredits={() => {
            setShowInsufficientModal(false);
            navigate('/credits');
          }}
        />
      )}

      {showSuccessModal && lastBookingResult && (
        <BookingSuccessModal
          consultantName={consultant.user?.name || consultant.name || 'Unknown'}
          date={bookingDate || new Date().toISOString().split('T')[0]}
          timeSlot={selectedSlot}
          fee={lastBookingResult.fee}
          remainingBalance={lastBookingResult.remainingBalance}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-8">

        {/* Back Button */}
        <button
          onClick={() => navigate('/user/search')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Search
        </button>

        {/* Wallet Balance Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet size={20} className="text-blue-600" />
            <span className="text-gray-600 text-sm font-medium">Your Wallet Balance</span>
          </div>
          <span className="text-2xl font-bold text-blue-700">₹{walletBalance.toFixed(2)}</span>
        </div>

        {/* Consultant Profile */}
        <div className="bg-white rounded-3xl p-8 border shadow-lg">
          <div className="flex flex-col md:flex-row gap-8">

            {/* Profile Image */}
            <div className="flex-shrink-0">
              <img
                src={consultant.profile_pic || consultant.image || '/default-avatar.png'}
                alt={consultant.user?.name || consultant.name || 'Unknown'}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
              />
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{consultant.user?.name || consultant.name || 'Unknown Consultant'}</h1>
              <p className="text-xl text-blue-600 font-semibold mb-4">{consultant.domain}</p>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  <Star size={16} className="text-yellow-500 mr-1" />
                  <span className="font-semibold">{consultant.rating ?? 5}</span>
                  <span className="text-gray-500">({consultant.total_reviews || 0} reviews)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <IndianRupee size={16} className="mr-2" />
                  <span className="font-semibold">₹{consultant.hourly_price} / session</span>
                </div>

                {consultant?.languages && (
                  <div className="flex items-center text-gray-600">
                    <MessageCircle size={16} className="mr-2" />
                    <span>{consultant.languages}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap gap-4 mt-6">
                {consultant?.linkedin_url && (
                  <a
                    href={consultant.linkedin_url.startsWith('http') ? consultant.linkedin_url : `https://${consultant.linkedin_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white rounded-xl hover:bg-[#006699] transition shadow-sm"
                  >
                    <Linkedin size={18} />
                    <span className="text-sm font-medium">LinkedIn</span>
                  </a>
                )}
                {consultant?.website_url && (
                  <a
                    href={consultant.website_url.startsWith('http') ? consultant.website_url : `https://${consultant.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition shadow-sm"
                  >
                    <Globe size={18} />
                    <span className="text-sm font-medium">Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {consultant.user?.profile?.bio && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-xl font-bold text-gray-800 mb-3">About</h3>
              <p className="text-gray-600 leading-relaxed">{consultant.user.profile.bio}</p>
            </div>
          )}
        </div>

        {/* Booking Section */}
        <div className="bg-white rounded-3xl p-8 border shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Book a Consultation</h2>

          {/* Fee banner */}
          {consultant.hourly_price && (
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <IndianRupee size={18} />
                <span className="font-medium">Session Fee</span>
              </div>
              <span className="text-xl font-bold text-blue-700">₹{consultant.hourly_price}</span>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Time Slots
              </label>
              {loadingSlots ? (
                <div className="flex justify-center py-4">
                  <Loader className="animate-spin text-blue-600" size={24} />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {bookingDate ? 'No available slots for this date' : 'Please select a date first'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 border rounded-xl">
                  {availableSlots.map((slot) => {
                    const startH = parseInt(slot.available_time);
                    const endHH = String(startH + 1).padStart(2, '0');
                    const label = `${slot.available_time}–${endHH}:00`;
                    const isSelected = selectedSlot === slot.available_time;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.available_time)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                      >
                        <Clock size={13} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleBookClick}
              disabled={!selectedSlot || !bookingDate}
              className={`flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center ${selectedSlot && bookingDate
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              <Calendar size={20} className="mr-2" />
              {selectedSlot ? 'Book Selected Slot' : 'Select a Time Slot'}
            </button>

            <button
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center"
            >
              <Video size={20} className="mr-2" />
              Start Video Call
            </button>
          </div>
        </div>
      </div>

      {/* UserPopupModal */}
      <UserPopupModal
        open={popup.open}
        title={popup.title}
        message={popup.message}
        icon={popup.icon}
        onClose={hidePopup}
      />
    </Layout>
  );
};

export default ConsultantDetailsPage;
