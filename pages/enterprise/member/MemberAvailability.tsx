import React, { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import api from "../../../services/api";

interface AvailabilitySlot {
  id: number;
  date: string;
  time_slot: string;
  consultant?: {
    user?: {
      email: string;
    };
  };
}

const MemberAvailability: React.FC = () => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await api.get("/availability");

        console.log("Availability API response:", response.data);

        // 🔥 Ensure we always store an array
        if (Array.isArray(response.data)) {
          setSlots(response.data);
        } else if (Array.isArray(response.data.slots)) {
          setSlots(response.data.slots);
        } else if (Array.isArray(response.data.data)) {
          setSlots(response.data.data);
        } else {
          setSlots([]);
        }

      } catch (error) {
        console.error("Failed to fetch availability", error);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Available Sessions</h1>

        {loading ? (
          <p className="text-gray-500">Loading availability...</p>
        ) : !Array.isArray(slots) || slots.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow">
            <p>No available sessions right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="bg-white p-6 rounded-xl shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">
                    {slot.consultant?.user?.email || "Consultant"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {new Date(slot.date).toLocaleDateString()} •{" "}
                    {slot.time_slot}
                  </p>
                </div>

                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Book
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MemberAvailability;