import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../../components/Layout";
import { bookings as bookingsApi } from "../../../services/api";
import api from "../../../services/api";
import { useAuth } from "../../../App";
import { Booking } from "../../../types";
import {
  Calendar,
  DollarSign,
  Star,
  Video,
  Loader,
  Award,
  Briefcase,
  Globe,
} from "lucide-react";

const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  /* ================= FETCH BOOKINGS ================= */

  useEffect(() => {
    fetchBookings();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/enterprise/member/profile");
      setProfile(response.data.profile);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await bookingsApi.getAll(); // ideally member endpoint
      setSessions(data || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= CALCULATIONS ================= */

  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === "COMPLETED"),
    [sessions]
  );

  const upcomingSessions = useMemo(
    () =>
      sessions.filter(
        (s) =>
          s.status === "CONFIRMED" || s.status === "LIVE"
      ),
    [sessions]
  );

  const todaySessions = useMemo(() => {
    const today = new Date().toDateString();
    return upcomingSessions.filter(
      (s) =>
        new Date(s.date).toDateString() === today
    );
  }, [upcomingSessions]);

  const totalEarnings = completedSessions.reduce(
    (sum, s) => sum + (s.price || 0),
    0
  );

  const averageRating = 4.8; // Replace with API when available

  if (loading) {
    return (
      <Layout title="Member Dashboard">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* ================= WELCOME WITH PROFILE ================= */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-3xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome Back, {user?.name || "Team Member"} 👋
              </h2>
              <p className="text-gray-600 mt-2">
                {profile?.designation ? `${profile.designation}` : "Enterprise Team Member"}
              </p>
              {profile?.bio && (
                <p className="text-gray-500 mt-2 text-sm max-w-md">{profile.bio}</p>
              )}
            </div>
            {user?.profile_photo && (
              <img
                src={user.profile_photo}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-blue-600 shadow-lg"
              />
            )}
          </div>

          {/* Profile Info Cards */}
          {profile && (
            <div className="grid md:grid-cols-4 gap-3 mt-6 pt-6 border-t">
              {profile.languages && (
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-blue-600" />
                  <span className="text-sm">{profile.languages}</span>
                </div>
              )}
              {profile.years_experience && (
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-600" />
                  <span className="text-sm">{profile.years_experience} years</span>
                </div>
              )}
              {profile.availability && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  <span className="text-sm">{profile.availability}</span>
                </div>
              )}
              {profile.expertise && profile.expertise.length > 0 && (
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-blue-600" />
                  <span className="text-sm">{profile.expertise.length} skills</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= STATS CARDS ================= */}
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              label: "Total Earnings",
              value: `₹${totalEarnings.toLocaleString()}`,
              icon: <DollarSign size={22} />,
            },
            {
              label: "Completed Sessions",
              value: completedSessions.length,
              icon: <Video size={22} />,
            },
            {
              label: "Today's Sessions",
              value: todaySessions.length,
              icon: <Calendar size={22} />,
            },
            {
              label: "Average Rating",
              value: averageRating,
              icon: <Star size={22} />,
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border shadow-sm"
            >
              <div className="text-blue-600 mb-4">
                {card.icon}
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {card.value}
              </p>
              <p className="text-xs uppercase font-bold text-gray-400 mt-1">
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* ================= UPCOMING SESSIONS ================= */}
        <div className="bg-white rounded-3xl p-8 border shadow-sm">
          <h3 className="text-xl font-bold mb-6">
            Upcoming Sessions
          </h3>

          {upcomingSessions.length === 0 ? (
            <p className="text-gray-400">
              No upcoming sessions.
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center border-b pb-3"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {session.user?.email || "Client"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(
                        session.date
                      ).toLocaleDateString()}{" "}
                      • {session.time_slot}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      session.status === "LIVE"
                        ? "bg-red-100 text-red-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default MemberDashboard;