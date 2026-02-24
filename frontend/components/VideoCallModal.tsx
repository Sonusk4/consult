import React, { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";

interface Props {
  bookingId: number;
  userId: number;
  socket: any;
  onClose: () => void;
  startAgora: boolean; // ✅ add this
}

const APP_ID = "YOUR_AGORA_APP_ID"; // 🔥 PUT YOUR APP ID HERE

const VideoCallModal: React.FC<Props> = ({
  bookingId,
  userId,
  socket,
  onClose,
  startAgora,
}) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTracks = useRef<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(
    null
  );

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (startAgora) {
      startCall();
      setTimerActive(true);
    }
  }, [startAgora]);
  useEffect(() => {
    let interval: any;

    if (timerActive) {
      interval = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerActive]);
  useEffect(() => {
    socket.on("video-call-ended", handleEndCall);

    return () => {
      socket.off("video-call-ended", handleEndCall);
      cleanup();
    };
  }, []);

  const startCall = async () => {
    try {
      const channelName = `booking_${bookingId}`;

      const res = await fetch(
        `http://${window.location.hostname}:5000/agora/token?channelName=${channelName}&userId=${userId}`
      );

      const data = await res.json();

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      await client.join(APP_ID, channelName, data.token, userId);

      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracks.current = tracks;

      tracks[1].play(localVideoRef.current!);
      await client.publish(tracks);

      client.on("user-published", async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType);

        if (mediaType === "video") {
          const remoteVideoTrack = remoteUser.videoTrack as IRemoteVideoTrack;
          remoteVideoTrack.play(remoteVideoRef.current!);
        }

        if (mediaType === "audio") {
          const remoteAudioTrack = remoteUser.audioTrack as IRemoteAudioTrack;
          remoteAudioTrack.play();
        }
      });
    } catch (err) {
      console.error("Agora Start Error:", err);
    }
  };

  const handleEndCall = async () => {
    await cleanup();
    onClose();
  };

  const cleanup = async () => {
    if (localTracks.current) {
      localTracks.current[0].close();
      localTracks.current[1].close();
    }

    if (clientRef.current) {
      await clientRef.current.leave();
    }
  };

  const toggleMic = async () => {
    if (!localTracks.current) return;
    await localTracks.current[0].setEnabled(!micOn);
    setMicOn(!micOn);
  };

  const toggleCamera = async () => {
    if (!localTracks.current) return;
    await localTracks.current[1].setEnabled(!cameraOn);
    setCameraOn(!cameraOn);
  };

  const endCall = () => {
    socket.emit("end-video-call", { bookingId });
    handleEndCall();
  };
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-95 flex flex-col items-center justify-center z-[9999]">
      {" "}
      {/* ✅ TIMER DISPLAY */}
      <div className="absolute top-6 text-white text-lg font-semibold">
        {formatTime(callSeconds)}
      </div>
      <div className="flex space-x-6 mb-6">
        <div ref={localVideoRef} className="w-80 h-60 bg-gray-800 rounded-xl" />
        <div
          ref={remoteVideoRef}
          className="w-80 h-60 bg-gray-800 rounded-xl"
        />
      </div>
      <div className="flex space-x-6">
        <button
          onClick={toggleMic}
          className={`px-6 py-3 rounded-xl ${
            micOn ? "bg-green-600" : "bg-red-600"
          } text-white`}
        >
          {micOn ? "Mute Mic" : "Unmute Mic"}
        </button>

        <button
          onClick={toggleCamera}
          className={`px-6 py-3 rounded-xl ${
            cameraOn ? "bg-green-600" : "bg-red-600"
          } text-white`}
        >
          {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
        </button>

        <button
          onClick={endCall}
          className="px-6 py-3 bg-red-700 text-white rounded-xl"
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default VideoCallModal;
