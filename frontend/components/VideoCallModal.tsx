import React, { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
} from "agora-rtc-sdk-ng";

interface Props {
  bookingId: number;
  userId: number;
  socket: any;
  onClose: () => void;
  startAgora: boolean;
}

const APP_ID = "4849ec6442124d598e08f8dd8b1e3dd2";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const VideoCallModal: React.FC<Props> = ({
  bookingId,
  userId,
  socket,
  onClose,
  startAgora,
}) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<
    [IMicrophoneAudioTrack, ICameraVideoTrack] | null
  >(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRemoteUser, setHasRemoteUser] = useState(false);
  const [localVideoReady, setLocalVideoReady] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    console.log("🎥 VideoCallModal mounted for booking:", bookingId);

    return () => {
      console.log("🎥 VideoCallModal unmounting for booking:", bookingId);
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (startAgora && mountedRef.current) {
      initializeCall();
    }
  }, [startAgora]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const initializeCall = async () => {
    try {
      setIsConnecting(true);
      console.log("🎥 Initializing video call for booking:", bookingId);

      // 1. Get token
      const channelName = `booking_${bookingId}`;
      console.log("📱 Fetching token for channel:", channelName);

      const response = await fetch(
        `${API_BASE_URL}/agora/token?channelName=${channelName}&userId=${userId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get token");
      }

      const { token } = await response.json();
      if (!mountedRef.current) return;
      console.log("✅ Token received");

      // 2. Create client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // 3. Set up event listeners
      client.on("user-published", async (user, mediaType) => {
        if (!mountedRef.current) return;

        console.log(`📡 Remote user published: ${mediaType}`);
        await client.subscribe(user, mediaType);

        if (mediaType === "video") {
          setHasRemoteUser(true);
          setTimeout(() => {
            if (remoteVideoRef.current && mountedRef.current) {
              user.videoTrack?.play(remoteVideoRef.current);
              console.log("✅ Remote video playing");
            }
          }, 100);
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", () => {
        console.log("Remote user unpublished");
        setHasRemoteUser(false);
      });

      client.on("user-left", () => {
        console.log("Remote user left");
        setHasRemoteUser(false);
      });

      // 4. Join channel
      console.log("🔗 Joining channel...");
      await client.join(APP_ID, channelName, token, userId);
      if (!mountedRef.current) return;
      console.log("✅ Joined channel");

      // 5. Create local tracks
      console.log("🎤 Creating local tracks...");
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = tracks;

      if (!mountedRef.current) return;

      // 6. Play local video
      if (localVideoRef.current) {
        // Clear any existing content
        while (localVideoRef.current.firstChild) {
          localVideoRef.current.removeChild(localVideoRef.current.firstChild);
        }

        // Play video
        tracks[1].play(localVideoRef.current);
        setLocalVideoReady(true);
        console.log("✅ Local video playing");
      }

      // 7. Publish tracks
      await client.publish(tracks);
      console.log("✅ Published tracks");

      // 8. Notify others - MAKE SURE THIS MATCHES BACKEND
      console.log("📢 Emitting start-video-call with:", {
        bookingId,
        callerId: userId,
      });
      socket.emit("start-video-call", {
        bookingId,
        callerId: userId,
      });
    } catch (err: any) {
      console.error("❌ Call failed:", err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setIsConnecting(false);
      }
    }
  };

  const cleanup = async () => {
    console.log("🧹 Cleaning up video call...");

    if (localTracksRef.current) {
      localTracksRef.current[0].close();
      localTracksRef.current[1].close();
      localTracksRef.current = null;
    }

    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current = null;
    }

    if (localVideoRef.current) {
      while (localVideoRef.current.firstChild) {
        localVideoRef.current.removeChild(localVideoRef.current.firstChild);
      }
    }
    if (remoteVideoRef.current) {
      while (remoteVideoRef.current.firstChild) {
        remoteVideoRef.current.removeChild(remoteVideoRef.current.firstChild);
      }
    }
  };

  const toggleMic = async () => {
    if (!localTracksRef.current) return;
    await localTracksRef.current[0].setEnabled(!micOn);
    setMicOn(!micOn);
  };

  const toggleCamera = async () => {
    if (!localTracksRef.current) return;
    await localTracksRef.current[1].setEnabled(!cameraOn);
    setCameraOn(!cameraOn);
  };

  const endCall = async () => {
    console.log("👋 Ending call...");
    socket.emit("end-video-call", { bookingId });
    await cleanup();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center z-[9999]">
      {/* Timer */}
      <div className="absolute top-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg font-mono text-lg">
        {formatTime(callSeconds)}
      </div>

      {/* Video Grid */}
      <div className="flex gap-4">
        {/* Local Video */}
        <div className="relative w-[480px] h-[360px] bg-gray-900 rounded-lg overflow-hidden border-2 border-blue-500">
          <div
            ref={localVideoRef}
            className="w-full h-full"
            style={{ backgroundColor: "#1a1a1a" }}
          />
          {!localVideoReady && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-900">
              <div className="text-center">
                <div className="text-4xl mb-2">📹</div>
                <div>Initializing camera...</div>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            You {!cameraOn && "(Camera Off)"}
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative w-[480px] h-[360px] bg-gray-900 rounded-lg overflow-hidden border-2 border-green-500">
          <div
            ref={remoteVideoRef}
            className="w-full h-full"
            style={{ backgroundColor: "#1a1a1a" }}
          />
          {!hasRemoteUser && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-900">
              <div className="text-center">
                <div className="text-4xl mb-2">👥</div>
                <div>Waiting for other participant...</div>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            Consultant
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button
          onClick={toggleMic}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            micOn
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          } text-white`}
        >
          {micOn ? "Mute" : "Unmute"}
        </button>

        <button
          onClick={toggleCamera}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            cameraOn
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          } text-white`}
        >
          {cameraOn ? "Camera Off" : "Camera On"}
        </button>

        <button
          onClick={endCall}
          className="px-6 py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg font-semibold transition"
        >
          End Call
        </button>
      </div>

      {isConnecting && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg">
          Connecting to video call...
        </div>
      )}
    </div>
  );
};

export default VideoCallModal;
