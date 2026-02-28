import React, { useState } from "react";
import { X, Star } from "lucide-react";
import api from "../services/api";

interface ReviewPopupProps {
  bookingId: number;
  onClose: () => void;
}

const ReviewPopup: React.FC<ReviewPopupProps> = ({ bookingId, onClose }) => {
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");

  const submitReview = async () => {
    try {
      await api.post("/reviews", {
        booking_id: bookingId,
        rating,
        review,
      });
      onClose();
    } catch (err) {
      console.error("Review submission failed:", err);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-[9999]">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Rate Your Consultation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Rating Stars */}
        <div className="flex gap-2 mb-4 justify-center">
          {[1, 2, 3, 4, 5].map((num) => (
            <Star
              key={num}
              size={32}
              onClick={() => setRating(num)}
              className={`cursor-pointer ${
                rating >= num ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Review Input */}
        <textarea
          className="w-full border rounded-xl p-3 text-gray-700"
          rows={4}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write your review..."
        />

        <button
          onClick={submitReview}
          className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
        >
          Submit Review
        </button>
      </div>
    </div>
  );
};

export default ReviewPopup;