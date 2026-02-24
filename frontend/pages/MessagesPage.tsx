import VideoCallModal from "../components/VideoCallModal";
import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import {
  Search,
  Send,
  Paperclip,
  MoreHorizontal,
  Phone,
  Video,
} from "lucide-react";
import { io } from "socket.io-client";
import { useUser } from "../src/services/hooks/useUser";

const MessagesPage: React.FC = () => {
  const { user: currentUser, loading: userLoading } = useUser();
  const [socket, setSocket] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callerInfo, setCallerInfo] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ FETCH BOOKINGS - Only fetch when user is loaded
  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) {
        console.log("⏳ Waiting for user to load before fetching bookings");
        return;
      }

      setIsLoadingBookings(true);
      try {
        console.log("📚 Fetching bookings for user:", currentUser.email);
        const res = await api.get("/bookings");
        console.log("Bookings fetched successfully:", res.data);
        setBookings(res.data);
      } catch (error: any) {
        console.error("Failed to fetch bookings:", error);
        if (error.response?.status === 401) {
          console.log("🔑 Token might be expired, retrying in 2 seconds...");
          // Retry once after a delay
          setTimeout(() => {
            fetchBookings();
          }, 2000);
        }
      } finally {
        setIsLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [currentUser]);

  // ✅ SOCKET CONNECTION with user email and ID
  useEffect(() => {
    if (!currentUser?.email) {
      console.log("❌ No user email found");
      return;
    }

    console.log("🔌 Connecting socket for user:", {
      email: currentUser.email,
      dbId: currentUser.id,
      role: currentUser.role,
    });

    const socketUrl = `http://${window.location.hostname}:5000`;
    console.log("🔌 Socket URL:", socketUrl);

    const newSocket = io(socketUrl, {
      auth: {
        email: currentUser.email,
        userId: currentUser.id,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket Connected Successfully!");
      console.log("✅ Socket ID:", newSocket.id);
      console.log("✅ Connected as user:", {
        email: currentUser.email,
        id: currentUser.id,
        role: currentUser.role,
      });
      setIsConnected(true);
    });

    newSocket.on("connect_error", (error: any) => {
      console.log("❌ Socket Connection Error:", error.message);
      setIsConnected(false);
    });

    newSocket.on("error", (error: any) => {
      console.log("❌ Socket Error:", error);
    });

    newSocket.on("disconnect", (reason: string) => {
      console.log("🔌 Socket Disconnected. Reason:", reason);
      setIsConnected(false);

      if (reason === "io server disconnect") {
        setTimeout(() => {
          console.log("🔄 Attempting to reconnect...");
          newSocket.connect();
        }, 1000);
      }
    });

    newSocket.io.on("reconnect_attempt", (attempt: number) => {
      console.log(`🔄 Reconnection attempt #${attempt}`);
    });

    newSocket.io.on("reconnect", () => {
      console.log("✅ Socket Reconnected!");
      setIsConnected(true);
    });

    setSocket(newSocket);

    return () => {
      console.log("🔌 Cleaning up socket connection");
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
      }
    };
  }, [currentUser]);

  // ✅ JOIN BOOKING ROOM WHEN SELECTED
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

  // ✅ FETCH MESSAGES WHEN BOOKING SELECTED
  useEffect(() => {
    if (!selectedBooking?.id || !currentUser) {
      console.log(
        "⏳ Waiting for user or booking to load before fetching messages"
      );
      return;
    }

    const fetchMessages = async () => {
      try {
        console.log(`📥 Fetching messages for booking ${selectedBooking.id}`);
        const response = await api.get(
          `/bookings/${selectedBooking.id}/messages`
        );
        console.log("📥 Messages fetched:", response.data);
        setMessages(response.data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, [selectedBooking?.id, currentUser]);

  // ✅ RECEIVE MESSAGE HANDLER
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: any) => {
      console.log("📩 Received message from socket:", message);

      setMessages((prev) => {
        // Check if this is a real message replacing a temp message
        const tempIndex = prev.findIndex(
          (m) =>
            m.id < 0 && // temp messages have negative IDs
            m.senderId === message.senderId &&
            m.content === message.content
        );

        if (tempIndex !== -1) {
          // Replace temp message with real one
          console.log("🔄 Replacing temp message with real message");
          const newMessages = [...prev];
          newMessages[tempIndex] = {
            ...message,
            isTemp: false, // Remove temp flag
          };
          return newMessages;
        }

        // Check if message already exists (prevent duplicates)
        const exists = prev.some((m) => m.id === message.id);
        if (exists) {
          console.log("⏭️ Message already exists, skipping:", message.id);
          return prev;
        }

        return [...prev, message];
      });
    };

    const handleIncomingCall = (data: any) => {
      if (currentUser && Number(data?.callerId) === Number(currentUser.id)) {
        return;
      }
      console.log("📞 Incoming call received");
      setIncomingCall(true);
      setCallerInfo(data);
    };

    const handleChatBlocked = (data: any) => {
      alert(data.message);
    };

    const handleChatError = (data: any) => {
      console.error("Chat error:", data);
      alert(data.message);
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("video-call-started", handleIncomingCall);
    socket.on("chat-blocked", handleChatBlocked);
    socket.on("chat-error", handleChatError);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("video-call-started", handleIncomingCall);
      socket.off("chat-blocked", handleChatBlocked);
      socket.off("chat-error", handleChatError);
    };
  }, [socket, currentUser]);

  // ✅ SEND MESSAGE
  const sendMessage = () => {
    if (!socket || !selectedBooking || !currentUser) {
      console.log("❌ Cannot send message - missing:", {
        hasSocket: !!socket,
        hasBooking: !!selectedBooking,
        hasUser: !!currentUser,
      });
      return;
    }

    if (!newMessage.trim()) return;

    console.log("📤 SENDING MESSAGE AS USER:", {
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      bookingId: selectedBooking.id,
    });

    const tempId = -Date.now();
    const tempMessage = {
      id: tempId,
      bookingId: selectedBooking.id,
      senderId: currentUser.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      isTemp: true,
      sender: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
      },
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    socket.emit("send-message", {
      bookingId: selectedBooking.id,
      content: newMessage,
    });
  };

  // Format date for display
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

  if (userLoading) {
    return (
      <Layout title="Messages">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading user data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout title="Messages">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="text-center">
            <p className="text-red-500">Please log in to view messages</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout title="Messages">
        <div className="max-w-7xl mx-auto h-[calc(100vh-12rem)] flex bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          {/* SIDEBAR */}
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
              {isLoadingBookings ? (
                <div className="p-6 text-center text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <p>No bookings yet</p>
                </div>
              ) : (
                bookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      console.log("📌 Booking clicked:", b);
                      setSelectedBooking(b);
                    }}
                    className={`w-full p-6 flex items-start space-x-4 border-b border-gray-50 transition-all ${
                      selectedBooking?.id === b.id
                        ? "bg-blue-50/50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
                      #{b.id}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        Booking #{b.id}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatBookingDate(b.date)} • {b.time_slot}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {b.is_paid ? (
                          <span className="text-green-600 font-medium">
                            Paid
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">
                            Unpaid
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 flex flex-col bg-gray-50/30">
            {/* HEADER */}
            <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">
                  {selectedBooking
                    ? `Booking #${selectedBooking.id}`
                    : "Select a conversation"}
                </p>
                {selectedBooking && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatBookingDate(selectedBooking.date)} at{" "}
                    {selectedBooking.time_slot}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
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
                  onClick={() => {
                    if (!selectedBooking || !socket || !currentUser) return;
                    socket.emit("start-video-call", {
                      bookingId: selectedBooking.id,
                      callerId: currentUser.id,
                    });
                    setIsCalling(true);
                  }}
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

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {messages.map((m, i) => {
                const isMyMessage =
                  Number(m.senderId) === Number(currentUser?.id);
                const isTempMessage = m.id < 0 || m.isTemp === true;

                return (
                  <div
                    key={m.id || i}
                    className={`flex ${
                      isMyMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-md p-4 rounded-2xl shadow ${
                        isMyMessage
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-white text-gray-700 rounded-bl-none"
                      } ${isTempMessage && isMyMessage ? "opacity-70" : ""}`}
                    >
                      {!isMyMessage && m.sender && (
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          {m.sender.name || m.sender.email || "User"}
                        </p>
                      )}
                      <p className="text-sm">{m.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isMyMessage ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {formatMessageTime(m.created_at)}
                        {isTempMessage && isMyMessage && " • Sending..."}
                      </p>
                    </div>
                  </div>
                );
              })}
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

            {/* INPUT */}
            {selectedBooking && (
              <div className="p-6 bg-white border-t border-gray-100 flex items-center space-x-4">
                <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <Paperclip size={20} />
                </button>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
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
      </Layout>

      {/* VIDEO MODAL */}
      {isCalling && selectedBooking && socket && currentUser && (
        <VideoCallModal
          bookingId={selectedBooking.id}
          userId={currentUser.id}
          socket={socket}
          onClose={() => setIsCalling(false)}
          startAgora={isCalling}
        />
      )}

      {/* INCOMING CALL POPUP */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-8 rounded-xl text-center w-80 shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2">Incoming Call</h2>
            <p className="text-gray-500 mb-6">
              {callerInfo?.callerName || "Someone"} is calling...
            </p>

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
    </>
  );
};

export default MessagesPage;
