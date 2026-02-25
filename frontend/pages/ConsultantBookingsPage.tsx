import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { bookings } from '../services/api';
import { 
  Calendar, 
  MessageCircle, 
  Video, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  User
} from 'lucide-react';

interface Booking {
  id: number;
  userId: number;
  consultantId: number;
  date: string;
  time_slot: string; // This is the actual booked time
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'CONFIRMED';
  is_paid: boolean;
  consultant_fee: number;
  user?: {
    id: number;
    email: string;
    name?: string;
  };
}

const ConsultantBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookings.getAll();
      setBookingsList(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (bookingId: number) => {
    try {
      const data = await bookings.getMessages(bookingId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleStatusUpdate = async (bookingId: number, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await bookings.updateStatus(bookingId, status);
      alert(`Booking ${status.toLowerCase()} successfully!`);
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error('Failed to update booking status:', error);
      alert('Failed to update booking status');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedBooking) return;

    try {
      await bookings.sendMessage(selectedBooking.id, message);
      setMessage('');
      fetchMessages(selectedBooking.id); // Refresh messages
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const openMessages = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowMessages(true);
    fetchMessages(booking.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'ACCEPTED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      case 'CANCELLED': return 'text-gray-600 bg-gray-100';
      case 'COMPLETED': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} />;
      case 'ACCEPTED': return <CheckCircle size={16} />;
      case 'REJECTED': return <XCircle size={16} />;
      case 'CANCELLED': return <XCircle size={16} />;
      case 'COMPLETED': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <Layout title="My Bookings">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Bookings">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Consultation Bookings</h1>
          <p className="text-gray-600">Manage your consultation requests and communicate with clients</p>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-3xl p-6 border shadow-sm">
          {bookingsList.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Bookings Yet</h3>
              <p className="text-gray-500">When clients book consultations, they'll appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookingsList.map((booking) => (
                <div key={booking.id} className="border rounded-2xl p-6 hover:shadow-md transition-shadow">
                  
                  {/* Booking Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {booking.user?.name || booking.user?.email || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">{booking.user?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar size={16} className="mr-2" />
                      <span>{new Date(booking.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock size={16} className="mr-2" />
                      <span>{booking.time_slot}</span>
                      <span className="text-xs text-gray-500 ml-2">(Booked Time)</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign size={16} className="mr-2" />
                      <span>₹{booking.consultant_fee}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'ACCEPTED')}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center"
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-xl font-semibold hover:bg-red-700 transition flex items-center justify-center"
                        >
                          <XCircle size={16} className="mr-2" />
                          Reject
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => openMessages(booking)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center"
                    >
                      <MessageCircle size={16} className="mr-2" />
                      Messages
                    </button>
                    
                    {booking.status === 'ACCEPTED' && (
                      <button
                        onClick={() => navigate(`/video-call/${booking.id}`)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center"
                      >
                        <Video size={16} className="mr-2" />
                        Start Video Call
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages Modal */}
        {showMessages && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Messages - Booking #{selectedBooking.id}
                </h3>
                <button
                  onClick={() => setShowMessages(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto mb-4 p-4 border rounded-xl">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center">No messages yet</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`p-3 rounded-xl ${msg.senderId === selectedBooking.consultantId ? 'bg-blue-100 ml-auto' : 'bg-gray-100'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ConsultantBookingsPage;
