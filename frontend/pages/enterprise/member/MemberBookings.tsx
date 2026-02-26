import React, { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import { bookings } from "../../../services/api";
import { Booking } from "../../../types";

const MemberBookings: React.FC = () => {
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await bookings.getAll();
        setData(response || []);
      } catch (error) {
        console.error("Failed to fetch bookings", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <Layout title="My Bookings">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

        {loading ? (
          <p className="text-gray-500">Loading bookings...</p>
        ) : data.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow">
            <p>No bookings found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((booking) => (
              <div
                key={booking.id}
                className="bg-white p-6 rounded-xl shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">
                    {booking.consultant?.user?.email || "Consultant"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {new Date(booking.date).toLocaleDateString()} •{" "}
                    {booking.time_slot}
                  </p>

                  <p className="text-sm mt-1">
                    Status:{" "}
                    <span className="font-semibold text-blue-600">
                      {booking.status}
                    </span>
                  </p>
                </div>

                {booking.meeting_link && (
                  <a
                    href={booking.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Join
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MemberBookings;