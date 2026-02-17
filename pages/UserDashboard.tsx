
import React from 'react';
import Layout from '../components/Layout';
import { MOCK_USER, MOCK_SESSIONS, TOP_CONSULTANTS } from '../constants';
import { SessionStatus } from '../types';
import { Video, Calendar, CreditCard, ChevronRight, Play, Star, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserDashboard: React.FC = () => {
  const liveSession = MOCK_SESSIONS.find(s => s.status === SessionStatus.LIVE);
  const upcomingSessions = MOCK_SESSIONS.filter(s => s.status === SessionStatus.UPCOMING);

  return (
    <Layout title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {MOCK_USER.name}! 👋</h2>
            <p className="text-gray-500">You have {upcomingSessions.length} sessions scheduled for this week.</p>
            <div className="mt-6 flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center space-x-2">
                <CreditCard className="text-blue-600" size={18} />
                <span className="font-bold text-blue-900">{MOCK_USER.credits} Credits</span>
              </div>
              <button className="text-blue-600 font-bold text-sm hover:underline flex items-center">
                Buy More Credits <Plus size={16} className="ml-1" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-6 rounded-2xl text-center">
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Sessions</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl text-center">
              <p className="text-2xl font-bold text-gray-900">4.9</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Avg. Rating Given</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Live Session Alert */}
            {liveSession && (
              <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <div className="bg-red-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white animate-pulse">
                    <Video size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Live Now</span>
                      <h3 className="font-bold text-gray-900">Session with {liveSession.partnerName}</h3>
                    </div>
                    <p className="text-sm text-red-600 font-medium">{liveSession.domain} • 45 mins remaining</p>
                  </div>
                </div>
                <button className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-600 transition-all flex items-center">
                  Join Room <Play size={18} className="ml-2" />
                </button>
              </div>
            )}

            {/* Upcoming Sessions List */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Upcoming Sessions</h3>
                <button className="text-sm text-blue-600 font-bold hover:underline">View Calendar</button>
              </div>
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-5 rounded-2xl border border-gray-50 bg-gray-50/30 flex items-center justify-between hover:border-blue-100 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{session.partnerName}</p>
                        <p className="text-xs text-gray-500">{session.startTime} • {session.type} Call</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="p-2 text-gray-400 hover:text-red-500 transition-colors"><ChevronRight size={20} /></button>
                      <button className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all">Details</button>
                    </div>
                  </div>
                ))}
                {upcomingSessions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="text-gray-300" size={32} />
                    </div>
                    <p className="text-gray-500 font-medium">No sessions scheduled for today</p>
                    <Link to="/user/search" className="text-blue-600 font-bold text-sm hover:underline mt-2 inline-block">Book a new session</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Experts */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Experts You Might Like</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {TOP_CONSULTANTS.slice(0, 2).map(c => (
                  <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-all">
                    <img src={c.image} alt={c.name} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{c.name}</p>
                      <p className="text-xs text-blue-600 font-bold mb-1">{c.domain}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Star size={12} className="text-yellow-400 mr-1" fill="currentColor" />
                        <span>{c.rating} • ${c.hourly_price}/session</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-3xl p-6 text-white overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4">Ready for expert advice?</h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">Book a session with top-tier professionals from around the globe.</p>
                <Link to="/user/search" className="bg-blue-600 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center hover:bg-blue-700 transition-all">
                  Find Consultant <ChevronRight className="ml-1" size={18} />
                </Link>
              </div>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Activity</h3>
              <div className="space-y-6">
                {[
                  { title: 'Booking Confirmed', time: '2h ago', desc: 'Dr. Sarah Smith accepted your request' },
                  { title: 'Credit Added', time: '5h ago', desc: '500 credits successfully added' },
                  { title: 'New Message', time: '1d ago', desc: 'Jessica Lee sent you a message' },
                ].map((act, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-bold text-gray-900">{act.title}</p>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{act.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{act.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserDashboard;
