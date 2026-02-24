import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Star, Loader } from "lucide-react";
import { useToast } from "../context/ToastContext";
import api from "../services/api";

interface Review {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  created_at: string;
  consultantReply?: string;
  replied_at?: string;
}

const ReviewsPage: React.FC = () => {
  const { addToast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // This should fetch reviews for logged-in consultant
      const response = await api.get("/consultant/reviews");
      setReviews(response.data);
    } catch (error: any) {
      addToast(error?.message || "Failed to load reviews", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (reviewId: number) => {
    if (!replyText.trim()) {
      addToast("Please write a reply", "error");
      return;
    }

    setReplySubmitting(true);

    try {
      const response = await api.post(`/reviews/${reviewId}/reply`, {
        reply: replyText,
      });

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                consultantReply: response.data.consultantReply,
                replied_at: response.data.replied_at,
              }
            : review
        )
      );

      setReplyText("");
      setReplyingTo(null);
      addToast("Reply submitted successfully!", "success");
    } catch (error: any) {
      addToast(error?.message || "Failed to submit reply", "error");
    } finally {
      setReplySubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={18}
            className={
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout title="Reviews">
        <div className="flex justify-center items-center h-96">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Reviews">
      <div className="max-w-4xl mx-auto space-y-6">

        <h2 className="text-2xl font-bold">Client Reviews</h2>

        {reviews.length === 0 && (
          <p className="text-gray-500 text-center">
            No reviews yet.
          </p>
        )}

        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-3xl p-6 border shadow-sm"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-900">
                {review.userName}
              </h3>
              {renderStars(review.rating)}
            </div>

            <p className="text-gray-600 text-sm">
              {review.comment}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              {new Date(review.created_at).toLocaleDateString()}
            </p>

            {/* If already replied */}
            {review.consultantReply ? (
              <div className="mt-4 bg-blue-50 p-4 rounded-2xl border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-blue-700">
                  Your Reply:
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  {review.consultantReply}
                </p>
                {review.replied_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.replied_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4">
                {replyingTo === review.id ? (
                  <>
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      className="w-full bg-gray-50 rounded-xl p-3 border focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />

                    <button
                      onClick={() => handleReplySubmit(review.id)}
                      disabled={replySubmitting}
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {replySubmitting ? "Replying..." : "Submit Reply"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setReplyingTo(review.id)}
                    className="text-blue-600 text-sm font-semibold hover:underline"
                  >
                    Reply
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ReviewsPage;
