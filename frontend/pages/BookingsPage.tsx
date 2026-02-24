import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Video,
  MessageSquare,
  Phone,
  MoreVertical,
  Filter
} from 'lucide-react';

interface Session {
  id: number;
  partnerName: string;
  domain: string;
  type: 'Video' | 'Audio' | 'Chat';
  startTime: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'LIVE';
}

const BookingsPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FORMAT DATE ---------------- */

  const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  /* ---------------- FETCH BOOKINGS ---------------- */

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get('/consultant/bookings');

        // 🔥 Safe extraction from any backend structure
        let bookings: any[] = [];

        if (Array.isArray(res.data)) {
          bookings = res.data;
        } else if (Array.isArray(res.data?.data)) {
          bookings = res.data.data;
        } else if (Array.isArray(res.data?.bookings)) {
          bookings = res.data.bookings;
        }

        setSessions(bookings);

      } catch (error) {
        console.error('Failed to fetch bookings');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  /* ---------------- FILTER ---------------- */

  const filteredSessions = Array.isArray(sessions)
    ? sessions.filter((s) => {
        if (activeTab === 'UPCOMING') {
          return s.status === 'UPCOMING' || s.status === 'LIVE';
        }
        return s.status === activeTab;
      })
    : [];

  /* ---------------- UI ---------------- */

  return (
    <Layout title="My Bookings">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex p-1 bg-gray-100 rounded-2xl w-full sm:w-auto">
            {['UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
                  activeTab === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <p className="text-gray-400 font-semibold">
              Loading bookings...
            </p>
          </div>
        )}

        {/* Sessions */}
        {!loading && (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:border-blue-200 transition-all"
              >
                {/* Icon */}
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                  {session.type === 'Video' ? (
                    <Video size={28} />
                  ) : session.type === 'Audio' ? (
                    <Phone size={28} />
                  ) : (
                    <MessageSquare size={28} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {session.partnerName}
                    </h3>

                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        session.status === 'LIVE'
                          ? 'bg-red-500 text-white animate-pulse'
                          : session.status === 'UPCOMING'
                          ? 'bg-blue-100 text-blue-600'
                          : session.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  <p className="text-gray-500 font-medium">
                    {session.domain}
                  </p>
                </div>

                {/* Date */}
                <div className="hidden lg:block px-6 border-x border-gray-50">
                  <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">
                    Date & Time
                  </p>
                  <p className="font-bold text-gray-900">
                    {formatDateTime(session.startTime)}
                  </p>
                </div>

                {/* Action */}
                <div className="flex items-center space-x-3">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                    {session.status === 'LIVE'
                      ? 'Join Now'
                      : 'Details'}
                  </button>

                  <button className="p-3 text-gray-400 hover:bg-gray-50 rounded-xl">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filteredSessions.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
                <Calendar className="mx-auto text-gray-200 mb-4" size={64} />
                <h4 className="text-xl font-bold text-gray-900">
                  No bookings found
                </h4>
                <p className="text-gray-500 mt-1">
                  When clients book sessions, they will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookingsPage;
