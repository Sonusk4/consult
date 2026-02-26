import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { consultants as consultantsApi, bookings } from '../../services/api';
import { Consultant } from '../../types';
import { Star, Calendar, Clock, DollarSign, ArrowLeft, Video, MessageCircle, Loader } from 'lucide-react';

interface TimeSlot {
  id: number;
  available_time: string;
  is_booked: boolean;
}

const ConsultantDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (id) {
      fetchConsultantDetails();
    }
  }, [id]);

  useEffect(() => {
    if (bookingDate && id) {
      fetchAvailableSlots();
    }
  }, [bookingDate, id]);

  const fetchConsultantDetails = async () => {
    try {
      const data = await consultantsApi.getById(id);
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
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookConsultation = async () => {
    if (!bookingDate || !selectedSlot) {
      alert('Please select both date and time slot for booking');
      return;
    }

    try {
      await bookings.create({
        consultant_id: parseInt(id),
        date: bookingDate,
        time_slot: selectedSlot,
      });

      alert('Booking request sent successfully! Waiting for consultant confirmation.');
      setBookingDate('');
      setSelectedSlot('');
      setBookingTime('');
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('Failed to send booking request. Please try again.');
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

  return (
    <Layout title={`${consultant.name} - Consultant Details`}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Back Button */}
        <button
          onClick={() => navigate('/search')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Search
        </button>

        {/* Consultant Profile */}
        <div className="bg-white rounded-3xl p-8 border shadow-lg">
          <div className="flex flex-col md:flex-row gap-8">

            {/* Profile Image */}
            <div className="flex-shrink-0">
              <img
                src={consultant.profile_pic || consultant.image || '/default-avatar.png'}
                alt={consultant.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
              />
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{consultant.name}</h1>
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
                  <DollarSign size={16} className="mr-2" />
                  <span className="font-semibold">₹{consultant.hourly_price} / session</span>
                </div>

                {consultant.languages && (
                  <div className="flex items-center text-gray-600">
                    <MessageCircle size={16} className="mr-2" />
                    <span>{consultant.languages}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {consultant.bio && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-xl font-bold text-gray-800 mb-3">About</h3>
              <p className="text-gray-600 leading-relaxed">{consultant.bio}</p>
            </div>
          )}
        </div>

        {/* Booking Section */}
        <div className="bg-white rounded-3xl p-8 border shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Book a Consultation</h2>

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
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-xl p-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.available_time)}
                      disabled={slot.is_booked}
                      className={`p-3 border rounded-lg text-sm font-medium transition-all ${selectedSlot === slot.available_time
                          ? 'bg-blue-600 text-white border-blue-600'
                          : slot.is_booked
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                        }`}
                    >
                      <Clock size={14} className="mb-1" />
                      <div>{slot.available_time}</div>
                      {slot.is_booked && (
                        <div className="text-xs text-red-500">Booked</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleBookConsultation}
              disabled={!selectedSlot}
              className={`flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center ${selectedSlot
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
    </Layout>
  );
};

export default ConsultantDetailsPage;
