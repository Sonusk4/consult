import VideoCallModal from "../components/VideoCallModal";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import {
  Search, Send, Paperclip, MoreHorizontal, Phone, Video,
  Clock, AlertCircle, CheckCircle, Lock, X, Timer,
} from "lucide-react";
import { io } from "socket.io-client";
import { useUser } from "../src/services/hooks/useUser";

/* ─── Session time helpers ───────────────────────────────── */

/** Returns {start, end} Date objects from a booking */
function getSlotWindow(booking: any): { start: Date; end: Date } | null {
  if (!booking?.date || !booking?.time_slot) return null;
  try {
    const bookingDate = new Date(booking.date);
    const [slotHour, slotMin] = booking.time_slot.split(":").map(Number);
    const start = new Date(bookingDate);
    start.setHours(slotHour, slotMin, 0, 0);
    const end = new Date(start);
    end.setHours(slotHour + 1, slotMin, 0, 0);
    return { start, end };
  } catch {
    return null;
  }
}

type SessionStatus = "before" | "active" | "ended" | "unknown";

function getSessionStatus(booking: any, now: Date): SessionStatus {
  const window = getSlotWindow(booking);
  if (!window) return "unknown";
  if (now < window.start) return "before";
  if (now >= window.start && now < window.end) return "active";
  return "ended";
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTimeToNext(ms: number): string {
  if (ms <= 0) return "";
  const totalSecs = Math.floor(ms / 1000);
  if (totalSecs < 60) return `${totalSecs}s`;
  const m = Math.floor(totalSecs / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/* ─── Early/Late Warning Popup ───────────────────────────── */
const SessionWarningPopup: React.FC<{
  status: SessionStatus;
  slotWindow: { start: Date; end: Date } | null;
  onClose: () => void;
}> = ({ status, slotWindow, onClose }) => {
  const startStr = slotWindow?.start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const endStr = slotWindow?.end.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const now = new Date();
  const msToStart = slotWindow ? slotWindow.start.getTime() - now.getTime() : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-center ${status === "before" ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-gray-500 to-gray-600"} text-white`}>
          <div className="bg-white/20 rounded-full p-3 w-fit mx-auto mb-3">
            {status === "before" ? <Clock size={32} className="text-white" /> : <Lock size={32} className="text-white" />}
          </div>
          <h2 className="text-xl font-bold">
            {status === "before" ? "Not Yet Open" : "Session Ended"}
          </h2>
          <p className={`text-sm mt-1 ${status === "before" ? "text-amber-100" : "text-gray-200"}`}>
            {status === "before"
              ? "This chat session hasn't started yet"
              : "This chat session has ended"}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-4">
          {status === "before" && slotWindow && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm text-gray-500">Chat opens at</p>
                <p className="text-2xl font-black text-amber-600">{startStr}</p>
                {msToStart > 0 && (
                  <p className="text-sm text-amber-500 mt-1">Opens in {formatTimeToNext(msToStart)}</p>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                Your session is booked for <strong>{startStr} – {endStr}</strong>. Please come back when the session starts.
              </p>
            </>
          )}
          {status === "ended" && slotWindow && (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <p className="text-sm text-gray-500">Session was scheduled for</p>
                <p className="text-lg font-bold text-gray-700">{startStr} – {endStr}</p>
              </div>
              <p className="text-gray-500 text-sm">
                This session has ended. Book a new session to continue consulting.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Session Status Banner ──────────────────────────────── */
const SessionBanner: React.FC<{
  status: SessionStatus;
  slotWindow: { start: Date; end: Date } | null;
  now: Date;
}> = ({ status, slotWindow, now }) => {
  if (status === "unknown" || !slotWindow) return null;

  if (status === "before") {
    const ms = slotWindow.start.getTime() - now.getTime();
    const startStr = slotWindow.start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return (
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-amber-700 text-sm">
        <AlertCircle size={15} />
        <span>Chat unlocks at <strong>{startStr}</strong> · Opens in {formatTimeToNext(ms)}</span>
      </div>
    );
  }

  if (status === "active") {
    const msLeft = slotWindow.end.getTime() - now.getTime();
    const pct = Math.max(0, Math.min(100, (msLeft / 3600000) * 100));
    return (
      <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Session Live
          </span>
          <span className="flex items-center gap-1 text-emerald-700 text-sm font-black">
            <Timer size={14} />
            {formatCountdown(msLeft)} remaining
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2 text-gray-500 text-sm">
        <CheckCircle size={15} />
        <span>Session ended · Chat is read-only</span>
      </div>
    );
  }

  return null;
};

/* ─── Main Component ─────────────────────────────────────── */
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
  const [activeCallBooking, setActiveCallBooking] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const [showWarning, setShowWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Is current user a consultant?
  const isConsultant = currentUser?.role === "CONSULTANT" || currentUser?.role === "ENTERPRISE_ADMIN";

  // Tick clock every second
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Derived session state
  const sessionStatus = selectedBooking ? getSessionStatus(selectedBooking, now) : "unknown";
  const slotWindow = selectedBooking ? getSlotWindow(selectedBooking) : null;
  const canSendMessage = sessionStatus === "active" && isConnected;
  const canStartVideo = isConsultant && sessionStatus === "active" && isConnected;

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) return;
      setIsLoadingBookings(true);
      try {
        const res = await api.get("/bookings");
        setBookings(res.data);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setIsLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [currentUser]);

  // Socket connection
  useEffect(() => {
    if (!currentUser?.email) return;
    const socketUrl = `http://${window.location.hostname}:5000`;
    const newSocket = io(socketUrl, {
      auth: { email: currentUser.email, userId: currentUser.id },
      transports: ["websocket", "polling"],
    });
    newSocket.on("connect", () => { setIsConnected(true); });
    newSocket.on("connect_error", () => { setIsConnected(false); });
    newSocket.on("disconnect", () => { setIsConnected(false); });
    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [currentUser]);

  // Join booking room
  useEffect(() => {
    if (!socket || !selectedBooking?.id || !socket.connected) return;
    socket.emit("join-booking", { bookingId: selectedBooking.id });
    return () => {
      if (socket.connected) socket.emit("leave-booking", { bookingId: selectedBooking.id });
    };
  }, [socket, selectedBooking?.id]);

  // Fetch messages
  useEffect(() => {
    if (!selectedBooking?.id || !currentUser) return;
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/bookings/${selectedBooking.id}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    fetchMessages();
  }, [selectedBooking?.id, currentUser]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: any) => {
      setMessages((prev) => {
        const tempIndex = prev.findIndex(
          (m) => m.id < 0 && m.senderId === message.senderId && m.content === message.content
        );
        if (tempIndex !== -1) {
          const arr = [...prev];
          arr[tempIndex] = { ...message, isTemp: false };
          return arr;
        }
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    const handleIncomingCall = (data: any) => {
      if (!data?.bookingId) return;
      if (currentUser && Number(data.callerId) === Number(currentUser.id)) return;
      const booking = bookings.find((b) => b.id === data.bookingId);
      if (booking) {
        setActiveCallBooking(booking);
        setIncomingCall(true);
        setCallerInfo(data);
      }
    };

    const handleChatBlocked = (data: any) => alert(data.message);
    const handleChatError = (data: any) => { console.error("Chat error:", data); alert(data.message); };

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
  }, [socket, currentUser, bookings]);

  /* ── Send Message (time-gated) ── */
  const sendMessage = useCallback(() => {
    if (!socket || !selectedBooking || !currentUser || !newMessage.trim()) return;

    // Block if session not active
    if (sessionStatus !== "active") {
      setShowWarning(true);
      return;
    }

    const tempId = -Date.now();
    const tempMessage = {
      id: tempId,
      bookingId: selectedBooking.id,
      senderId: currentUser.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      isTemp: true,
      sender: { id: currentUser.id, email: currentUser.email, name: currentUser.name },
    };
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");
    socket.emit("send-message", { bookingId: selectedBooking.id, content: newMessage });
  }, [socket, selectedBooking, currentUser, newMessage, sessionStatus]);

  /* ── Start Video Call (consultant only, session active) ── */
  const startVideoCall = () => {
    if (!selectedBooking || !socket || !currentUser) return;
    if (!isConsultant) return; // guard: should not be visible, but protect anyway
    if (sessionStatus !== "active") { setShowWarning(true); return; }
    setActiveCallBooking(selectedBooking);
    setIsCalling(true);
    socket.emit("start-video-call", { bookingId: selectedBooking.id, callerId: currentUser.id });
  };

  const acceptCall = () => { setIncomingCall(false); setIsCalling(true); };
  const rejectCall = () => {
    setIncomingCall(false);
    if (socket && activeCallBooking) socket.emit("end-video-call", { bookingId: activeCallBooking.id });
    setActiveCallBooking(null);
  };

  const formatMessageTime = (d: string) => {
    try { return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  /* ── Booking sidebar label ── */
  const getBookingLabel = (b: any) => {
    if (!currentUser) return `Booking #${b.id}`;
    if (isConsultant) return b.user?.name || b.user?.email || `User #${b.userId}`;
    return b.consultant?.user?.name || b.consultant?.user?.email || `Booking #${b.id}`;
  };

  const getStatusChip = (b: any) => {
    const st = getSessionStatus(b, now);
    if (st === "before") return <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">Upcoming</span>;
    if (st === "active") return <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold animate-pulse">● Live</span>;
    return <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-semibold">Ended</span>;
  };

  /* ── Render ── */
  if (userLoading) {
    return (
      <Layout title="Messages">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }
  if (!currentUser) {
    return (
      <Layout title="Messages">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <p className="text-red-500">Please log in to view messages</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout title="Messages">
        <div className="max-w-7xl mx-auto h-[calc(100vh-12rem)] flex bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">

          {/* ── SIDEBAR ── */}
          <div className="w-80 border-r border-gray-100 flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text" placeholder="Search chats..."
                  className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingBookings ? (
                <div className="p-6 text-center text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                  <p>Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <Phone size={32} className="mx-auto mb-2 opacity-40" />
                  <p>No bookings yet</p>
                </div>
              ) : (
                bookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setSelectedBooking(b); setMessages([]); setShowWarning(false); }}
                    className={`w-full p-5 flex items-start space-x-3 border-b border-gray-50 transition-all ${selectedBooking?.id === b.id ? "bg-blue-50/60" : "hover:bg-gray-50"}`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                      {getBookingLabel(b)[0]?.toUpperCase() || "#"}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-bold text-gray-900 text-sm truncate">{getBookingLabel(b)}</p>
                        {getStatusChip(b)}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(b.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {b.time_slot} – {String(parseInt(b.time_slot) + 1).padStart(2, "0")}:00
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── CHAT AREA ── */}
          <div className="flex-1 flex flex-col bg-gray-50/30">

            {/* Chat Header */}
            <div className="bg-white p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">
                  {selectedBooking ? getBookingLabel(selectedBooking) : "Select a conversation"}
                </p>
                {selectedBooking && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(selectedBooking.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    &nbsp;·&nbsp;{selectedBooking.time_slot} – {String(parseInt(selectedBooking.time_slot) + 1).padStart(2, "0")}:00
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Connection dot */}
                <span className={`text-xs flex items-center gap-1.5 ${isConnected ? "text-emerald-600" : "text-red-400"}`}>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-400 animate-pulse"}`} />
                  {isConnected ? "Connected" : "Disconnected"}
                </span>

                {/* Video button — consultant only */}
                {selectedBooking && isConsultant && (
                  <button
                    onClick={startVideoCall}
                    disabled={!canStartVideo}
                    title={!canStartVideo ? (sessionStatus === "before" ? "Video unlocks when session starts" : "Session ended") : "Start video call"}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${canStartVideo
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    <Video size={16} />
                    {sessionStatus === "active" ? "Start Call" : sessionStatus === "before" ? "Locked" : "Ended"}
                  </button>
                )}

                {/* User sees this instead of video button */}
                {selectedBooking && !isConsultant && (
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                    <Video size={14} />
                    Consultant initiates call
                  </span>
                )}

                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <MoreHorizontal size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Session Status Banner */}
            {selectedBooking && (
              <SessionBanner status={sessionStatus} slotWindow={slotWindow} now={now} />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {!selectedBooking && (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Phone size={48} className="mx-auto mb-4 opacity-40" />
                    <p className="font-medium">Select a booking to start chatting</p>
                    <p className="text-sm mt-1">Your active sessions will appear here</p>
                  </div>
                </div>
              )}

              {selectedBooking && messages.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    {sessionStatus === "before" && (
                      <>
                        <Clock size={40} className="mx-auto mb-3 text-amber-400" />
                        <p className="font-medium text-amber-600">Session not started yet</p>
                        <p className="text-sm mt-1">Come back at {slotWindow?.start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                      </>
                    )}
                    {sessionStatus === "active" && (
                      <>
                        <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500" />
                        <p className="font-medium text-emerald-600">Session is live!</p>
                        <p className="text-sm mt-1">Send a message to start the conversation</p>
                      </>
                    )}
                    {sessionStatus === "ended" && (
                      <>
                        <Lock size={40} className="mx-auto mb-3 text-gray-400" />
                        <p className="font-medium">Session ended</p>
                        <p className="text-sm mt-1">No messages were exchanged</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {messages.map((m, i) => {
                const isMyMessage = Number(m.senderId) === Number(currentUser?.id);
                const isTemp = m.id < 0 || m.isTemp === true;
                return (
                  <div key={m.id || i} className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-sm px-4 py-3 rounded-2xl shadow-sm text-sm
                      ${isMyMessage
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-700 rounded-bl-none border border-gray-100"
                      } ${isTemp && isMyMessage ? "opacity-70" : ""}`}
                    >
                      {!isMyMessage && m.sender && (
                        <p className="text-xs font-semibold text-gray-400 mb-1">
                          {m.sender.name || m.sender.email || "User"}
                        </p>
                      )}
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-1 ${isMyMessage ? "text-blue-200" : "text-gray-400"}`}>
                        {formatMessageTime(m.created_at)}{isTemp && isMyMessage && " · Sending..."}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {selectedBooking && (
              <div className={`p-5 border-t flex items-center gap-3 ${sessionStatus === "active" ? "bg-white" : "bg-gray-50"}`}>
                <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
                  <Paperclip size={18} />
                </button>
                <div className="flex-1 relative">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={
                      sessionStatus === "before"
                        ? `Chat opens at ${slotWindow?.start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}…`
                        : sessionStatus === "ended"
                          ? "Session has ended"
                          : !isConnected ? "Connecting…" : "Type your message…"
                    }
                    className={`w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-all
                      ${sessionStatus === "active" && isConnected
                        ? "bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500"
                        : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                  />
                  {sessionStatus !== "active" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Lock size={15} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={`p-4 rounded-2xl shadow transition-all
                    ${newMessage.trim()
                      ? sessionStatus === "active" && isConnected
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </Layout>

      {/* ── Warning Popup ── */}
      {showWarning && (
        <SessionWarningPopup
          status={sessionStatus}
          slotWindow={slotWindow}
          onClose={() => setShowWarning(false)}
        />
      )}

      {/* ── Video Modal ── */}
      {isCalling && activeCallBooking && socket && currentUser && (
        <VideoCallModal
          key={`call-${activeCallBooking.id}`}
          bookingId={activeCallBooking.id}
          userId={currentUser.id}
          socket={socket}
          onClose={() => { setIsCalling(false); setActiveCallBooking(null); }}
          startAgora={isCalling}
        />
      )}

      {/* ── Incoming Call Popup ── */}
      {incomingCall && activeCallBooking && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-8 rounded-3xl text-center w-80 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="text-emerald-600" size={30} />
            </div>
            <h2 className="text-xl font-black mb-2 text-gray-900">Incoming Call</h2>
            <p className="text-gray-500 mb-2">{callerInfo?.callerName || "Your consultant"} is calling…</p>
            <p className="text-xs text-gray-400 mb-6">Booking #{activeCallBooking.id}</p>
            <div className="flex gap-3">
              <button onClick={acceptCall} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition">
                Accept
              </button>
              <button onClick={rejectCall} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition">
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
