// src/pages/enterprise/member/MemberMessages.tsx
import React, { useState, useEffect, useRef } from "react";
import Layout from "../../../components/Layout";
import api from "../../../services/api";
import { useAuth } from "../../../App";
import { io } from "socket.io-client";
import VideoCallModal from "../../../components/VideoCallModal";
import {
  Search,
  Send,
  Video,
  MoreHorizontal,
  Phone,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Users,
  Building,
} from "lucide-react";

interface Booking {
  id: number;
  userId: number;
  date: string;
  time_slot: string;
  status: string;
  is_paid: boolean;
  user: {
    id: number;
    email: string;
    name?: string;
    profile?: {
      avatar?: string;
    };
  };
}

interface Message {
  id: number | string;
  bookingId: number;
  senderId: number | string;
  content: string;
  created_at: string;
  sender?: {
    id: number | string;
    email: string;
    name?: string;
    role?: string;
  };
}

const MemberMessages: React.FC = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callerInfo, setCallerInfo] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>(
    {}
  );
  const typingTimeoutRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log("📚 Fetching enterprise member bookings...");

        // ✅ CORRECT ENDPOINT - matches your backend
        const response = await api.get("/enterprise/member/bookings");
        console.log("✅ Bookings fetched:", response.data);
        setBookings(response.data);
      } catch (error) {
        console.error("❌ Failed to fetch bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  // Socket connection
  useEffect(() => {
    if (!user?.email || !user?.id) return;

    console.log("🔌 Connecting socket for member:", user.email);

    const socketUrl = `http://${window.location.hostname}:5000`;
    const newSocket = io(socketUrl, {
      auth: {
        email: user.email,
        userId: user.id,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected successfully");
      setIsConnected(true);
    });

    newSocket.on("connect_error", (error: any) => {
      console.log("❌ Socket connection error:", error.message);
      setIsConnected(false);
    });

    newSocket.on("disconnect", (reason: string) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("receive-message", (message: Message) => {
      console.log("📩 Received message:", message);
      setMessages((prev) => {
        // Check for duplicate
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    newSocket.on("video-call-started", (data: any) => {
      console.log("📞 Incoming call:", data);
      if (data.callerId !== user.id) {
        setIncomingCall(true);
        setCallerInfo(data);
      }
    });

    newSocket.on("video-call-ended", () => {
      console.log("📞 Call ended");
      setIncomingCall(false);
      setIsCalling(false);
    });

    newSocket.on("user-typing", (data: any) => {
      if (data.userId !== user.id) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.isTyping,
        }));
      }
    });

    newSocket.on("user-joined", (data: any) => {
      console.log("👋 User joined:", data);
    });

    newSocket.on("user-left", (data: any) => {
      console.log("👋 User left:", data);
    });

    setSocket(newSocket);

    return () => {
      console.log("🔌 Cleaning up socket");
      newSocket.disconnect();
    };
  }, [user]);

  // Join booking room when selected
  useEffect(() => {
    if (!socket || !selectedBooking?.id || !socket.connected) return;

    console.log(`🔌 Joining booking_${selectedBooking.id} room`);
    socket.emit("join-booking", {
      bookingId: selectedBooking.id,
    });

    return () => {
      if (socket.connected) {
        console.log(`🔌 Leaving booking_${selectedBooking.id} room`);
        socket.emit("leave-booking", {
          bookingId: selectedBooking.id,
        });
      }
    };
  }, [socket, selectedBooking?.id]);

  // Fetch messages when booking selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedBooking?.id) return;

      try {
        console.log(`📥 Fetching messages for booking ${selectedBooking.id}`);

        // ✅ CORRECT ENDPOINT - matches your backend
        const response = await api.get(
          `/bookings/${selectedBooking.id}/messages`
        );
        console.log("✅ Messages fetched:", response.data);
        setMessages(response.data);
      } catch (error) {
        console.error("❌ Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, [selectedBooking?.id]);

  const sendMessage = () => {
    if (!socket || !selectedBooking || !user || !newMessage.trim()) return;

    console.log("📤 Sending message:", {
      bookingId: selectedBooking.id,
      content: newMessage,
      userId: user.id,
    });

    // Create temp message for immediate display
    const tempMessage: Message = {
      id: -Date.now(),
      bookingId: selectedBooking.id,
      senderId: user.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    setMessages((prev) => [...prev, tempMessage]);
    socket.emit("send-message", {
      bookingId: selectedBooking.id,
      content: newMessage,
    });
    setNewMessage("");

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("typing", { bookingId: selectedBooking.id, isTyping: false });
  };

  const handleTyping = () => {
    if (!socket || !selectedBooking || !user) return;

    socket.emit("typing", { bookingId: selectedBooking.id, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { bookingId: selectedBooking.id, isTyping: false });
    }, 1000);
  };

  const startVideoCall = () => {
    if (!socket || !selectedBooking || !user) return;

    console.log("📞 Starting video call for booking:", selectedBooking.id);
    socket.emit("start-video-call", {
      bookingId: selectedBooking.id,
      callerId: user.id,
    });
    setIsCalling(true);
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const formatBookingDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const isTyping = Object.values(typingUsers).some((v) => v === true);

  return (
    <Layout title="Messages">
      <div className="h-[calc(100vh-12rem)] flex bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        {/* Sidebar - Bookings List */}
        <div className="w-80 border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <Building size={48} className="mx-auto mb-4 opacity-30" />
                <p>No bookings yet</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`w-full p-6 flex items-start space-x-4 border-b border-gray-50 transition-all ${
                    selectedBooking?.id === booking.id
                      ? "bg-blue-50/50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                    {booking.user?.name?.[0] || booking.user?.email?.[0] || "C"}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      Client:{" "}
                      {booking.user?.name || booking.user?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatBookingDate(booking.date)} • {booking.time_slot}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {booking.is_paid ? (
                        <span className="text-xs flex items-center text-green-600">
                          <CheckCircle size={12} className="mr-1" />
                          Paid
                        </span>
                      ) : (
                        <span className="text-xs flex items-center text-amber-600">
                          <Clock size={12} className="mr-1" />
                          Unpaid
                        </span>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Confirmed
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50/30">
          {/* Header */}
          <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">
                {selectedBooking
                  ? `Chat with ${
                      selectedBooking.user?.name ||
                      selectedBooking.user?.email ||
                      "Client"
                    }`
                  : "Select a conversation"}
              </p>
              {selectedBooking && (
                <p className="text-xs text-gray-400 mt-1">
                  {formatBookingDate(selectedBooking.date)} at{" "}
                  {selectedBooking.time_slot}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isConnected && (
                <span className="text-xs text-red-500 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                  Disconnected
                </span>
              )}
              {isConnected && (
                <span className="text-xs text-green-500 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Connected
                </span>
              )}

              <button
                onClick={startVideoCall}
                disabled={!selectedBooking || !isConnected}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  !selectedBooking || !isConnected
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                <Video size={18} />
                <span>Start Call</span>
              </button>

              <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <MoreHorizontal size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {messages.map((msg) => {
              const isMyMessage = msg.senderId === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isMyMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-md p-4 rounded-2xl shadow ${
                      isMyMessage
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-700 rounded-bl-none"
                    } ${typeof msg.id === 'number' && msg.id < 0 ? "opacity-70" : ""}`}
                  >
                    {!isMyMessage && msg.sender && (
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {msg.sender.name || msg.sender.email || "Client"}
                      </p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isMyMessage ? "text-blue-200" : "text-gray-400"
                      }`}
                    >
                      {formatMessageTime(msg.created_at)}
                      {typeof msg.id === 'number' && msg.id < 0 && " • Sending..."}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {messages.length === 0 && selectedBooking && (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">
                  Send a message to start the conversation
                </p>
              </div>
            )}
            {!selectedBooking && (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Phone size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a booking to start chatting</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {selectedBooking && (
            <div className="p-6 bg-white border-t border-gray-100 flex items-center space-x-4">
              <input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 bg-gray-50 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={!isConnected}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className={`p-4 rounded-2xl shadow-lg transition-all ${
                  !newMessage.trim() || !isConnected
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100"
                }`}
              >
                <Send size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Video Call Modal */}
      {isCalling && selectedBooking && socket && user && (
        <VideoCallModal
          bookingId={selectedBooking.id}
          userId={Number(user.id)}
          socket={socket}
          onClose={() => setIsCalling(false)}
          startAgora={isCalling}
          userRole={user.role}
          userName={user.name || user.email}
        />
      )}

      {/* Incoming Call Popup */}
      {incomingCall && callerInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-8 rounded-xl text-center w-80 shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2">Incoming Video Call</h2>
            <p className="text-gray-500 mb-1">
              {callerInfo.callerName || "Someone"} is calling...
            </p>
            {callerInfo.callerRole && (
              <p className="text-sm text-gray-400 mb-6">
                Role: {callerInfo.callerRole}
              </p>
            )}

            <div className="flex justify-between gap-4">
              <button
                onClick={() => {
                  setIncomingCall(false);
                  setIsCalling(true);
                }}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all"
              >
                Accept
              </button>

              <button
                onClick={() => {
                  setIncomingCall(false);
                  if (socket && selectedBooking) {
                    socket.emit("end-video-call", {
                      bookingId: selectedBooking.id,
                    });
                  }
                }}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MemberMessages;
