import VideoCallModal from "../components/VideoCallModal";
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { Search, Send, Paperclip, MoreHorizontal } from "lucide-react";
import { io } from "socket.io-client";

const MessagesPage: React.FC = () => {
  const [socket, setSocket] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callerInfo, setCallerInfo] = useState<any>(null);
  // ✅ FETCH BOOKINGS
  useEffect(() => {
    api.get("/bookings").then((res) => {
      console.log("Bookings:", res.data);
      setBookings(res.data);
    });
  }, []);
  //useEffect(() => {
  //const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  //fetch("http://localhost:5000/bookings", {
  //headers: {
  //"Content-Type": "application/json",
  //"x-user-email": user.email,
  //},
  //})
  //.then((res) => res.json())
  //.then((data) => {
  //console.log("Bookings:", data);
  //setBookings(data);
  //});
  //}, []);
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");

    if (!user?.email) return;

    const newSocket = io(`http://${window.location.hostname}:5000`, {
      auth: {
        email: user.email,
      },
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket Connected:", user.email);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);
  useEffect(() => {
    if (!socket || !selectedBooking) return;

    if (!socket.connected) {
      socket.once("connect", () => {
        console.log("🔁 Socket connected late, emitting join-booking");
        socket.emit("join-booking", {
          bookingId: selectedBooking.id,
        });
      });
      return;
    }

    console.log("✅ Emitting join-booking immediately");

    socket.emit("join-booking", {
      bookingId: selectedBooking.id,
    });
  }, [socket, selectedBooking?.id]); // 🔥 IMPORTANT CHANGE
  useEffect(() => {
    setMessages([]);
  }, [selectedBooking]);
  // ✅ RECEIVE MESSAGE
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg: any) => {
      console.log("📨 Received:", msg);
      setMessages((prev) => [...prev, msg]);
    };

    const handleIncomingCall = (data: any) => {
      const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

      // 🔥 Ignore if I am the caller
      if (Number(currentUser.id) === Number(data?.callerId)) {
        return;
      }

      console.log("📞 Incoming call received");

      setIncomingCall(true);
      setCallerInfo(data);
    };

    // ✅ NEW BLOCK HANDLER
    const handleChatBlocked = (data: any) => {
      alert(data.message);
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("video-call-started", handleIncomingCall);

    // ✅ ADD THIS
    socket.on("chat-blocked", handleChatBlocked);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("video-call-started", handleIncomingCall);

      // ✅ ADD THIS
      socket.off("chat-blocked", handleChatBlocked);
    };
  }, [socket]);

  // ✅ SEND MESSAGE
  const sendMessage = () => {
    if (!socket || !newMessage || !selectedBooking) return;

    const msgData = {
      bookingId: selectedBooking.id, // number only
      content: newMessage, // must be "content"
    };

    socket.emit("send-message", msgData);

    setNewMessage("");
  };
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
              {bookings.map((b) => (
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
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                    B
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      Booking #{b.id}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              background: "white",
              zIndex: 9999,
            }}
          >
            Selected: {selectedBooking?.id || "NONE"}
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 flex flex-col bg-gray-50/30">
            {/* HEADER */}
            <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between">
              <p className="font-bold text-gray-900">
                {selectedBooking
                  ? `Booking #${selectedBooking.id}`
                  : "Select Chat"}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!selectedBooking || !socket) return;

                    const currentUser = JSON.parse(
                      sessionStorage.getItem("user") || "{}"
                    );

                    socket.emit("start-video-call", {
                      bookingId: selectedBooking.id,
                      callerId: currentUser.id,
                    });

                    setIsCalling(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  Start Call
                </button>

                <button
                  onClick={() => setIsCalling(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Test Call
                </button>

                <MoreHorizontal size={20} />
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {messages.map((m, i) => {
                const user = JSON.parse(sessionStorage.getItem("user") || "{}");
                return (
                  <div
                    key={i}
                    className={`max-w-md p-4 rounded-2xl shadow ${
                      Number(m.senderId) === Number(user.id)
                        ? "bg-blue-600 text-white ml-auto"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    <p className="text-sm">{m.content}</p>
                  </div>
                );
              })}
            </div>

            {/* INPUT */}
            <div className="p-6 bg-white border-t border-gray-100 flex items-center space-x-4">
              <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                <Paperclip size={20} />
              </button>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-50 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </Layout>

      {/* 🔥 VIDEO MODAL OUTSIDE LAYOUT */}
      {isCalling && selectedBooking && socket && (
        <VideoCallModal
          bookingId={selectedBooking.id}
          userId={JSON.parse(sessionStorage.getItem("user") || "{}").id}
          socket={socket}
          onClose={() => setIsCalling(false)}
          startAgora={isCalling}
        />
      )}

      {/* 🔥 INCOMING CALL POPUP OUTSIDE LAYOUT */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-8 rounded-xl text-center w-80">
            <h2 className="text-xl font-bold mb-4">Incoming Call...</h2>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setIncomingCall(false);
                  setIsCalling(true);
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg"
              >
                Accept
              </button>

              <button
                onClick={() => {
                  setIncomingCall(false);
                  socket.emit("end-video-call", {
                    bookingId: selectedBooking?.id,
                  });
                }}
                className="bg-red-600 text-white px-6 py-2 rounded-lg"
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
