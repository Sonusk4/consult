import React, { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Star, X } from "lucide-react";

interface VideoCallModalProps {
  bookingId: number;
  userId: number;
  socket: any;
  onClose: () => void;
  startAgora: boolean;
  userRole?: string;
  userName?: string;
  consultantId?: number;
  consultantName?: string;
}



const VideoCallModal: React.FC<VideoCallModalProps> = ({

  bookingId,

  userId,

  socket,

  onClose,

  startAgora,

  userRole,

  userName = "User",

  consultantId,

  consultantName,

}) => {

  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);

  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const [isJoined, setIsJoined] = useState(false);

  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

  const [connectionState, setConnectionState] = useState("connecting");

  const [error, setError] = useState<string | null>(null);

  const [showReviewForm, setShowReviewForm] = useState(false);

  const [rating, setRating] = useState(0);

  const [comment, setComment] = useState("");

  const [submittingReview, setSubmittingReview] = useState(false);

  const [reviewNotice, setReviewNotice] = useState<{
    open: boolean;
    title: string;
    message: string;
    closeCall?: boolean;
  }>({
    open: false,
    title: "",
    message: "",
    closeCall: false,
  });

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

    // Show review form only for end-users

    if (userRole === "USER") {

      setShowReviewForm(true);

    } else {

      onClose();

    }

  };



  const submitReview = async () => {

    if (rating === 0) {

      setReviewNotice({
        open: true,
        title: "Rating Required",
        message: "Please select a rating before submitting your review.",
        closeCall: false,
      });

      return;

    }



    try {

      setSubmittingReview(true);

      const response = await api.post(`/bookings/${bookingId}/review`, {

        rating,

        comment: comment.trim(),

      }, {
        validateStatus: (status) => status === 200 || status === 201 || status === 400,
      });

      const alreadySubmitted =
        response.status === 400 &&
        String(response.data?.error || "").toLowerCase().includes("already submitted");

      if (alreadySubmitted) {
        setSubmittingReview(false);
        setReviewNotice({
          open: true,
          title: "Review Already Submitted",
          message: "You have already submitted a review for this booking.",
          closeCall: true,
        });
        return;
      }

      setSubmittingReview(false);
      setReviewNotice({
        open: true,
        title: "Review Submitted",
        message: "Thank you for sharing your feedback.",
        closeCall: true,
      });
      return;

    } catch (err: any) {

      setReviewNotice({
        open: true,
        title: "Review Submission Failed",
        message: err.response?.data?.error || err.response?.data?.message || err.message || "Please try again.",
        closeCall: false,
      });

      setSubmittingReview(false);

    }

  };

  const closeReviewNotice = () => {
    const shouldCloseCall = reviewNotice.closeCall;
    setReviewNotice({ open: false, title: "", message: "", closeCall: false });
    if (shouldCloseCall) {
      setShowReviewForm(false);
      onClose();
    }
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



  if (showReviewForm) {

    return (

      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">

        {reviewNotice.open && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{reviewNotice.title}</h3>
              <p className="text-sm text-gray-600 mb-5">{reviewNotice.message}</p>
              <button
                onClick={closeReviewNotice}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                OK
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-bold">Rate Your Consultation</h2>

            <button

              onClick={onClose}

              className="text-gray-400 hover:text-gray-600"

            >

              <X size={24} />

            </button>

          </div>



          {/* Rating Stars */}

          <div className="mb-6">

            <label className="block text-sm font-medium text-gray-700 mb-3">

              How was your experience?

            </label>

            <div className="flex gap-2 justify-center">

              {[1, 2, 3, 4, 5].map((star) => (

                <button

                  key={star}

                  onClick={() => setRating(star)}

                  className={`transition p-1 ${

                    star <= rating

                      ? "text-yellow-400"

                      : "text-gray-300 hover:text-yellow-300"

                  }`}

                >

                  <Star size={32} fill={star <= rating ? "currentColor" : "none"} />

                </button>

              ))}

            </div>

            <p className="text-center text-gray-600 mt-2">

              {rating > 0 ? `${rating} out of 5 stars` : "Select a rating"}

            </p>

          </div>



          {/* Comment */}

          <div className="mb-6">

            <label className="block text-sm font-medium text-gray-700 mb-2">

              Additional Comments (Optional)

            </label>

            <textarea

              value={comment}

              onChange={(e) => setComment(e.target.value)}

              placeholder="Share your feedback..."

              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"

              rows={4}

            />

          </div>



          {/* Buttons */}

          <div className="flex gap-3">

            <button

              onClick={onClose}

              className="flex-1 px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium"

              disabled={submittingReview}

            >

              Skip

            </button>

            <button

              onClick={submitReview}

              disabled={submittingReview || rating === 0}

              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"

            >

              {submittingReview ? "Submitting..." : "Submit Review"}

            </button>

          </div>

        </div>

      </div>

    );

  }



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

    </div>

  );

};



export default VideoCallModal;