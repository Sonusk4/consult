// src/components/VideoCallModal.tsx - FIXED VERSION
import React, { useEffect, useRef, useState } from "react";
import api from "../services/api";
import ReviewPopup from "./ReviewPopup";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users } from "lucide-react";

interface VideoCallModalProps {
  bookingId: number;
  userId: number;
  socket: any;
  onClose: () => void;
  startAgora: boolean;
  userRole?: string;
  userName?: string;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  bookingId,
  userId,
  socket,
  onClose,
  startAgora,
  userRole = "USER",
  userName = "User",
}) => {
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [connectionState, setConnectionState] = useState("connecting");
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const hasJoinedRef = useRef<boolean>(false);

  const clientRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  useEffect(() => {
    if (!startAgora) return;
    if (hasJoinedRef.current) return;

    hasJoinedRef.current = true;

    let client: any;

    const initAgora = async () => {
      try {
        setConnectionState("connecting");

        const appId = import.meta.env.VITE_AGORA_APP_ID;
        if (!appId) throw new Error("Agora App ID missing");

        const response = await api.get("/agora/token", {
          params: {
            channelName: `booking_${bookingId}`,
            userId: userId,
          },
        });

        const { token, uid } = response.data;

        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        await client.join(appId, `booking_${bookingId}`, token, uid);

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        await client.publish([audioTrack, videoTrack]);

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        setIsJoined(true);
        setConnectionState("connected");
      } catch (err: any) {
        setError(err.message || "Failed to start call");
        setConnectionState("failed");
      }
    };

    initAgora();

    return () => {
      if (clientRef.current) {
        clientRef.current.removeAllListeners();
        clientRef.current.leave();
        clientRef.current = null;
      }
    };
  }, [startAgora]); // 🚨 ONLY DEPEND ON startAgora

  // Listen for remote user joined events
  useEffect(() => {
    if (!socket) return;

    const handleRemoteUserJoined = (data: any) => {
      console.log("👋 Remote user joined:", data);
    };

    socket.on("remote-user-joined", handleRemoteUserJoined);

    return () => {
      socket.off("remote-user-joined", handleRemoteUserJoined);
    };
  }, [socket]);

  const toggleAudio = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const endCall = () => {
    socket.emit("end-video-call", { bookingId });

    if (userRole === "USER") {
      setShowReview(true);
      return; // IMPORTANT: stops modal from closing
    }

    onClose();
  };

  // Get role display name
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "ENTERPRISE_MEMBER":
        return "Enterprise Member";
      case "CONSULTANT":
        return "Consultant";
      case "USER":
        return "Client";
      default:
        return role;
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Call Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-7xl max-h-[90vh] m-8 bg-gray-900 rounded-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-gray-400" />
            <span className="text-white font-medium">
              {remoteUsers.length + 1} participant
              {remoteUsers.length !== 0 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded text-xs ${
                connectionState === "connected"
                  ? "bg-green-600"
                  : connectionState === "connecting"
                  ? "bg-yellow-600"
                  : "bg-red-600"
              } text-white`}
            >
              {connectionState}
            </span>
            <span className="text-white text-sm">
              {getRoleDisplay(userRole)}
            </span>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 grid grid-cols-2 gap-4 overflow-auto">
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden">
            <div ref={localVideoRef} className="w-full h-full" />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white text-sm flex items-center gap-2">
              <span>You ({getRoleDisplay(userRole)})</span>
              {!isVideoEnabled && (
                <span className="text-red-400 text-xs">(Video off)</span>
              )}
            </div>
          </div>

          {/* Remote Videos */}
          {remoteUsers.map((user) => (
            <div
              key={user.uid}
              className="relative bg-gray-800 rounded-2xl overflow-hidden"
            >
              <div
                ref={(el) => {
                  if (el) remoteVideoRefs.current[user.uid] = el;
                }}
                className="w-full h-full"
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white text-sm">
                Participant
              </div>
            </div>
          ))}

          {remoteUsers.length === 0 && isJoined && (
            <div className="bg-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-500">
              <Users size={48} className="mb-2 opacity-30" />
              <p>Waiting for other participant to join...</p>
              <p className="text-sm mt-2">Share the booking ID with them</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 flex items-center justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition ${
              isAudioEnabled
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition ${
              isVideoEnabled
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
          </button>

          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition"
            title="End call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
      {showReview && (
        <ReviewPopup
          bookingId={bookingId}
          onClose={() => setShowReview(false)}
        />
      )}
    </div>
  );
};

export default VideoCallModal;