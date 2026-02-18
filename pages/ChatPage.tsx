import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Send, Phone, Video, Info, User as UserIcon } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';
import { Booking } from '../types';

interface Message {
  id: number;
  senderId: number;
  content: string;
  type: string;
  createdAt: string;
  read_at?: string;
}

interface ChatUser {
  id: number;
  name: string;
  email: string;
  role: 'client' | 'consultant';
}

const ChatPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !bookingId) return;

    // Join booking room
    socket.emit('join-booking', bookingId);

    // Listen for messages
    socket.on('receive-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Listen for typing indicators
    socket.on('user-typing', ({ userId, isTyping }: { userId: number; isTyping: boolean }) => {
      if (otherUser && userId === otherUser.id) {
        setIsTyping(isTyping);
      }
    });

    // Listen for read receipts
    socket.on('message-read', ({ messageId }: { messageId: number }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read_at: new Date().toISOString() } : msg
        )
      );
    });

    // Listen for errors
    socket.on('ERROR', (error: { message: string }) => {
      alert(error.message);
    });

    // Listen for payment required
    socket.on('PAYMENT_REQUIRED', (error: { message: string }) => {
      alert(error.message);
      navigate('/user/wallet');
    });

    return () => {
      socket.off('receive-message');
      socket.off('user-typing');
      socket.off('message-read');
      socket.off('ERROR');
      socket.off('PAYMENT_REQUIRED');
    };
  }, [socket, bookingId, otherUser, navigate]);

  useEffect(() => {
    // Fetch booking details
    const fetchBooking = async () => {
      try {
        const response = await api.get(`/bookings/${bookingId}`);
        setBooking(response.data);
      } catch (error) {
        console.error('Error fetching booking:', error);
      }
    };

    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/bookings/${bookingId}/messages`);
        setMessages(response.data);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    if (bookingId) {
      fetchMessages();
    }
  }, [bookingId]);

  useEffect(() => {
    // Determine other user based on booking
    if (booking) {
      // This would need to be determined based on current user role
      // For now, assuming current user is client
      setOtherUser({
        id: booking.consultantId,
        name: 'Consultant', // This would come from consultant data
        email: 'consultant@example.com',
        role: 'consultant'
      });
    }
  }, [booking]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      bookingId,
      senderId: 1, // This would come from current user
      role: 'client',
      content: newMessage,
      type: 'text'
    };

    socket.emit('send-message', messageData);
    setNewMessage('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (socket && otherUser) {
      socket.emit('typing', {
        bookingId,
        userId: otherUser.id,
        isTyping: e.target.value.length > 0
      });
    }
  };

  const markAsRead = (messageId: number) => {
    if (socket) {
      socket.emit('mark-read', { messageId, bookingId, userId: 1 });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!booking) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader className="animate-spin mx-auto" size={48} />
            <p className="mt-4 text-gray-600">Loading chat...</p>
          </div>
        </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-screen">
        {/* Chat Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">{otherUser?.name}</h3>
              <p className="text-sm text-gray-500">{isConnected ? 'Online' : 'Offline'}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600">
              <Phone size={16} />
            </button>
            <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
              <Video size={16} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.senderId === 1 ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderId === 1 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                <p className="text-sm italic">Other user is typing...</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t px-4 py-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isConnected}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
