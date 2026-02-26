import React, { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import api from "../../../services/api";

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: {
    email: string;
  };
}

const MemberReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get("/reviews/member");

        console.log("Reviews API response:", response.data);

        // 🔥 Ensure we always store an array
        if (Array.isArray(response.data)) {
          setReviews(response.data);
        } else if (Array.isArray(response.data.reviews)) {
          setReviews(response.data.reviews);
        } else if (Array.isArray(response.data.data)) {
          setReviews(response.data.data);
        } else {
          setReviews([]);
        }

      } catch (error) {
        console.error("Failed to fetch reviews", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <Layout title="My Reviews">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">My Reviews</h1>

        {loading ? (
          <p className="text-gray-500">Loading reviews...</p>
        ) : !Array.isArray(reviews) || reviews.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow">
            <p>No reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-6 rounded-xl shadow"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold">
                    {review.reviewer?.email || "Anonymous"}
                  </p>

                  {/* ⭐ Star Display */}
                  <div className="text-yellow-500 text-sm">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                </div>

                <p className="text-gray-700">{review.comment}</p>

                <p className="text-xs text-gray-400 mt-3">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MemberReviews;