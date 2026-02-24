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

// Use Agora App ID from environment variable
const APP_ID = "4849ec6442124d598e08f8dd8b1e3dd2";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);
  
  // Refs to manage component state and prevent cancelled operations
  const isJoiningRef = useRef(false);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (startAgora && !isJoiningRef.current && isMountedRef.current) {
      isJoiningRef.current = true;
      setIsJoining(true);
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

  // Request camera and microphone permissions
  const requestPermissions = async () => {
    try {
      console.log(`🔐 Requesting camera and microphone permissions...`);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
      });
      
      console.log(`✅ Permissions granted!`, {
        audio: stream.getAudioTracks().length > 0,
        video: stream.getVideoTracks().length > 0,
      });
      
      // Stop the stream since we just used it to request permissions
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      console.error(`❌ Permission denied:`, error);
      throw new Error(`Camera/Microphone permission denied: ${error.message}`);
    }
  };

  const startCall = async () => {
    // Prevent duplicate calls
    if (isJoiningRef.current && clientRef.current) {
      console.log("⚠️ Already joining, skipping duplicate call");
      return;
    }

    // Check if component is still mounted
    if (!isMountedRef.current) {
      console.log("⚠️ Component unmounted, skipping startCall");
      return;
    }

    try {
      // Request permissions first
      await requestPermissions();

      const channelName = `booking_${bookingId}`;
      
      console.log(`📱 Fetching Agora token for channel: ${channelName}, userId: ${userId}`);

      // Create a new abort controller for this call
      abortControllerRef.current = new AbortController();

      // Fetch Agora token from backend with abort support
      const tokenResponse = await fetch(
        `${API_BASE_URL}/agora/token?channelName=${channelName}&userId=${userId}`,
        { signal: abortControllerRef.current.signal }
      );

      // Check if component is still mounted after fetch
      if (!isMountedRef.current) {
        console.log("⚠️ Component unmounted during token fetch");
        return;
      }

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || `Failed to get Agora token: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.token) {
        throw new Error("No token received from backend");
      }

      console.log(`✅ Agora token received, joining channel: ${channelName}`);

      // Clean up any existing client before creating new one
      if (clientRef.current) {
        console.log("🧹 Cleaning up existing client");
        try {
          await clientRef.current.leave();
        } catch (e) {
          console.warn("Warning cleaning up old client:", e);
        }
        clientRef.current = null;
      }

      // Check if component is still mounted before joining
      if (!isMountedRef.current) {
        console.log("⚠️ Component unmounted before joining channel");
        return;
      }

      // Create Agora RTC client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // Join the channel with the token
      await client.join(APP_ID, channelName, tokenData.token, userId);
      console.log(`✅ Successfully joined Agora channel`);

      // Check if component is still mounted after joining
      if (!isMountedRef.current) {
        console.log("⚠️ Component unmounted after joining, cleaning up");
        await client.leave();
        return;
      }

      // Create and publish local tracks
      console.log(`🎤 Requesting camera and microphone access...`);
      let tracks;
      try {
        tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
          {
            audioConfig: { 
              noiseSuppression: true,
              echoCancellation: true,
              autoGainControl: true,
            },
            videoConfig: {
              encoderConfig: "720p_auto",
              facingMode: "user",
            },
          },
          null,  // encoderConfig
          null   // cameraId
        );
      } catch (trackError: any) {
        console.error(`❌ Failed to create tracks:`, trackError);
        console.error(`Error details:`, {
          name: trackError.name,
          message: trackError.message,
          code: trackError.code,
        });
        throw new Error(`Camera/Microphone access: ${trackError.message}. Please check browser permissions and allow camera/microphone access.`);
      }

      localTracks.current = tracks;

      console.log(`📹 Local tracks created:`, {
        audio: {
          enabled: tracks[0].enabled,
          muted: tracks[0].muted,
          trackId: (tracks[0] as any).trackId,
        },
        video: {
          enabled: tracks[1].enabled,
          muted: tracks[1].muted,
          trackId: (tracks[1] as any).trackId,
        },
      });

      // Check if video track is available (this is critical)
      if (!tracks[1]) {
        throw new Error("Video track not created - please check camera permissions");
      }

      // Make sure container exists and is properly set up
      if (!localVideoRef.current) {
        throw new Error("Video container not found in DOM");
      }

      // Log container info
      console.log(`🎯 Local video container info:`, {
        element: localVideoRef.current.tagName,
        id: localVideoRef.current.id,
        className: localVideoRef.current.className,
        offsetWidth: localVideoRef.current.offsetWidth,
        offsetHeight: localVideoRef.current.offsetHeight,
        display: window.getComputedStyle(localVideoRef.current).display,
      });

      // Ensure video track is not muted
      if ((tracks[1] as any).muted) {
        console.log("🔊 Unmuting video track");
        await (tracks[1] as any).setMuted(false);
      }

      // Play local video with error handling
      if (localVideoRef.current && isMountedRef.current) {
        try {
          console.log(`📺 [STEP 1] About to play local video track`);
          
          // Clear placeholder but keep container
          const children = Array.from(localVideoRef.current.children);
          children.forEach(child => child.remove());
          
          console.log(`📺 [STEP 2] Cleared placeholder, container is ready`);
          console.log(`📺 [STEP 3] Container dimensions:`, {
            width: localVideoRef.current.clientWidth,
            height: localVideoRef.current.clientHeight,
            computed: {
              width: window.getComputedStyle(localVideoRef.current).width,
              height: window.getComputedStyle(localVideoRef.current).height,
            },
          });

          // Ensure container has proper styling
          localVideoRef.current.style.width = '100%';
          localVideoRef.current.style.height = '100%';
          localVideoRef.current.style.display = 'block';
          
          console.log(`📺 [STEP 4] Calling tracks[1].play(container)`);
          
          const playResult = tracks[1].play(localVideoRef.current);
          
          console.log(`📺 [STEP 5] Play result:`, playResult);
          console.log(`✅ Local video is now playing`);
          
          // Mark as ready and hide placeholder
          setTimeout(() => {
            if (isMountedRef.current) {
              setLocalVideoReady(true);
              console.log(`✅ [Delayed] Local video marked as ready`);
            }
          }, 300);
          
        } catch (e: any) {
          console.error(`❌ Error playing local video:`, e);
          console.error(`Error name:`, e.name);
          console.error(`Error message:`, e.message);
          console.error(`Full error:`, e);
          throw new Error(`Failed to display local video: ${e.message}`);
        }
      } else {
        console.warn(`⚠️ Local video ref not available or component unmounted`);
      }
      
      // Publish tracks to channel
      await client.publish(tracks);
      console.log(`✅ Local tracks published to channel`);

      // Handle remote user publishing tracks
      client.on("user-published", async (remoteUser, mediaType) => {
        if (!isMountedRef.current) return;
        
        try {
          console.log(`📢 Remote user published:`, {
            userId: remoteUser.uid,
            mediaType,
          });

          await client.subscribe(remoteUser, mediaType);
          console.log(`✅ Subscribed to remote user ${remoteUser.uid} ${mediaType}`);

          if (mediaType === "video") {
            const remoteVideoTrack = remoteUser.videoTrack as IRemoteVideoTrack;
            
            if (remoteVideoRef.current && isMountedRef.current) {
              try {
                console.log(`📺 [REMOTE STEP 1] About to play remote video track`);
                
                // Clear placeholder
                const children = Array.from(remoteVideoRef.current.children);
                children.forEach(child => child.remove());
                
                console.log(`📺 [REMOTE STEP 2] Cleared placeholder`);
                
                // Ensure container has proper styling
                remoteVideoRef.current.style.width = '100%';
                remoteVideoRef.current.style.height = '100%';
                remoteVideoRef.current.style.display = 'block';
                
                console.log(`📺 [REMOTE STEP 3] Container dimensions:`, {
                  width: remoteVideoRef.current.clientWidth,
                  height: remoteVideoRef.current.clientHeight,
                });
                
                console.log(`📺 [REMOTE STEP 4] Calling remoteVideoTrack.play(container)`);
                
                const playResult = remoteVideoTrack.play(remoteVideoRef.current);
                
                console.log(`📺 [REMOTE STEP 5] Play result:`, playResult);
                console.log(`✅ Remote video is now playing`);
                
                // Mark as ready
                setTimeout(() => {
                  if (isMountedRef.current) {
                    setRemoteVideoReady(true);
                    console.log(`✅ [Delayed] Remote video marked as ready`);
                  }
                }, 300);
              } catch (e: any) {
                console.error(`❌ Error playing remote video:`, e);
                console.error(`Error name:`, e.name);
                console.error(`Error message:`, e.message);
              }
            } else {
              console.warn(`⚠️ Remote video ref not available or component unmounted`);
            }
          }

          if (mediaType === "audio") {
            const remoteAudioTrack = remoteUser.audioTrack as IRemoteAudioTrack;
            try {
              remoteAudioTrack.play();
              console.log(`✅ Remote audio is now playing`);
            } catch (e) {
              console.error(`❌ Error playing remote audio:`, e);
            }
          }
        } catch (e) {
          console.warn("Error subscribing to remote user:", e);
        }
      });

      // Handle remote user unpublishing
      client.on("user-unpublished", async (remoteUser, mediaType) => {
        if (!isMountedRef.current) return;
        try {
          await client.unsubscribe(remoteUser, mediaType);
          console.log(`Remote user unpublished:`, mediaType);
        } catch (e) {
          console.warn("Error unsubscribing:", e);
        }
      });

    } catch (err: any) {
      // Ignore abort errors (expected when component unmounts)
      if (err.name === "AbortError") {
        console.log("ℹ️ Call setup aborted");
        return;
      }

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log("⚠️ Error occurred but component unmounted");
        return;
      }

      const errorMessage = err.message || "Failed to start video call";
      console.error("❌ Agora Start Error:", err);
      
      // Handle OPERATION_ABORTED specifically
      if (errorMessage.includes("OPERATION_ABORTED")) {
        console.error("❌ Operation aborted: Call setup was cancelled");
        setError("Call setup was interrupted");
      } else if (errorMessage.includes("UID_CONFLICT")) {
        console.error("❌ UID Conflict: User already in channel or duplicate join detected");
        setError("User is already in this call");
      } else {
        setError(errorMessage);
      }
      
      alert(`Video call error: ${errorMessage}`);
      onClose();
    } finally {
      if (isMountedRef.current) {
        isJoiningRef.current = false;
        setIsJoining(false);
      }
    }
  };

  const handleEndCall = async () => {
    await cleanup();
    onClose();
  };

  const cleanup = async () => {
    try {
      console.log("🧹 Cleaning up video call resources");
      
      // Abort any pending fetch operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Close local tracks
      if (localTracks.current) {
        try {
          localTracks.current[0].close(); // Audio track
          localTracks.current[1].close(); // Video track
          console.log("✅ Local tracks closed");
        } catch (e) {
          console.warn("Warning closing tracks:", e);
        }
        localTracks.current = null;
      }

      // Leave channel and clean up client
      if (clientRef.current) {
        try {
          await clientRef.current.leave();
          console.log("✅ Left Agora channel");
        } catch (e) {
          console.warn("Warning leaving channel:", e);
        }
        clientRef.current = null;
      }

      isJoiningRef.current = false;
      if (isMountedRef.current) {
        setIsJoining(false);
      }
    } catch (e) {
      console.error("Error during cleanup:", e);
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
      {error && (
        <div className="absolute top-6 left-6 right-6 bg-red-600 text-white p-4 rounded-lg max-w-md z-50">
          <p className="font-semibold">❌ Error: {error}</p>
          <p className="text-sm mt-2">Troubleshoot:</p>
          <ul className="text-sm mt-1 ml-4 list-disc">
            <li>Check camera permissions (Settings → Privacy → Camera)</li>
            <li>Open Console (F12) to see detailed error messages</li>
            <li>Refresh page if stuck</li>
          </ul>
        </div>
      )}
      
      {!localVideoReady && !error && (
        <div className="absolute top-20 bg-blue-600 text-white px-4 py-2 rounded text-sm">
          ⏳ Initializing camera...
        </div>
      )}
      
      {/* ✅ TIMER DISPLAY */}
      <div className="absolute top-6 right-6 text-white text-lg font-semibold">
        {formatTime(callSeconds)}
      </div>
      <div className="flex gap-8 mb-8 mt-4">
        {/* Local Video */}
        <div className="relative" style={{ width: "384px", height: "288px" }}>
          <div 
            ref={localVideoRef} 
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#111827",
              overflow: "hidden",
              borderRadius: "8px",
              border: "2px solid #3b82f6",
              position: "relative",
              display: "block",
            }}
          >
            {!localVideoReady && (
              <div 
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#111827",
                  color: "#9ca3af",
                  fontSize: "14px",
                  textAlign: "center",
                  zIndex: localVideoReady ? -1 : 1,
                  pointerEvents: "none",
                }}
              >
                <div>📹 Connecting...</div>
              </div>
            )}
          </div>
          <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
            You
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative" style={{ width: "384px", height: "288px" }}>
          <div
            ref={remoteVideoRef}
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#111827",
              overflow: "hidden",
              borderRadius: "8px",
              border: "2px solid #22c55e",
              position: "relative",
              display: "block",
            }}
          >
            {!remoteVideoReady && (
              <div 
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#111827",
                  color: "#9ca3af",
                  fontSize: "14px",
                  textAlign: "center",
                  zIndex: remoteVideoReady ? -1 : 1,
                  pointerEvents: "none",
                }}
              >
                <div>👥 Waiting for remote user...</div>
              </div>
            )}
          </div>
          <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
            Consultant
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-6 mt-8">
        <button
          onClick={toggleMic}
          className={`px-8 py-3 rounded-lg font-semibold transition ${
            micOn ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
          } text-white`}
        >
          {micOn ? "🎤 Mute" : "🎤 Unmute"}
        </button>

        <button
          onClick={toggleCamera}
          className={`px-8 py-3 rounded-lg font-semibold transition ${
            cameraOn ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
          } text-white`}
        >
          {cameraOn ? "📹 Camera On" : "📹 Camera Off"}
        </button>

        <button
          onClick={endCall}
          className="px-8 py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg font-semibold transition"
        >
          ☎️ End Call
        </button>
      </div>
    </div>
  );
};

export default VideoCallModal;
