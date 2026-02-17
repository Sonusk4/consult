
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { consultants as consultantsApi } from '../services/api';
import { Consultant, SessionStatus } from '../types';
import { MOCK_SESSIONS } from '../constants'; // Keep mock sessions for now as bookings API integration is complex
import { TrendingUp, Users, Calendar, Clock, DollarSign, ArrowUpRight, CheckCircle, Video, Loader } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const DATA = [
  { name: 'Mon', revenue: 450 },
  { name: 'Tue', revenue: 300 },
  { name: 'Wed', revenue: 600 },
  { name: 'Thu', revenue: 800 },
  { name: 'Fri', revenue: 550 },
  { name: 'Sat', revenue: 900 },
  { name: 'Sun', revenue: 700 },
];

const ConsultantDashboard: React.FC = () => {
  const [profile, setProfile] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await consultantsApi.getProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Expert Portal">
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Expert Portal">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Status Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {profile?.is_verified && <CheckCircle size={20} className="text-blue-200" />}
                <span className="text-blue-100 font-bold text-sm tracking-wider uppercase">{profile?.is_verified ? 'Verified Profile' : 'Pending Verification'}</span>
              </div>
              <h2 className="text-3xl font-bold mb-2">Good morning, {profile?.name || 'Expert'}!</h2>
              <p className="text-blue-100/80 max-w-md">You have 4 sessions today and a potential payout of $1,250 scheduled for Friday.</p>
            </div>
            <div className="mt-6 md:mt-0 flex space-x-3">
              <button className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all">Go Live</button>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-gray-50 transition-all">Withdraw Earnings</button>
            </div>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Analytics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Today\'s Earnings', value: '$840', change: '+12%', icon: <DollarSign className="text-emerald-600" />, color: 'bg-emerald-50' },
            { label: 'Active Sessions', value: '14', change: '85% success', icon: <Video className="text-blue-600" />, color: 'bg-blue-50' },
            { label: 'Profile Views', value: '1,204', change: '+24%', icon: <Users className="text-amber-600" />, color: 'bg-amber-50' },
            { label: 'Avg. Rating', value: profile?.rating || 'New', change: 'Excellent', icon: <Clock className="text-purple-600" />, color: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-2xl`}>{stat.icon}</div>
                <div className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight size={14} className="mr-0.5" /> {stat.change}
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Revenue Overview</h3>
                <p className="text-sm text-gray-500">Weekly breakdown of earnings</p>
              </div>
              <select className="bg-gray-50 border-none rounded-xl text-sm font-bold px-4 py-2 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DATA}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                  <Tooltip
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={32}>
                    {DATA.map((entry, index) => (
                      <Cell key={index} fill={entry.revenue > 600 ? '#2563EB' : '#DBEAFE'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Availability Calendar (Simplified) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Slots Today</h3>
              <button className="p-2 hover:bg-gray-50 rounded-xl transition-all"><TrendingUp size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              {[
                { time: '10:00 AM', status: 'Booked', client: 'Alex Johnson' },
                { time: '11:30 AM', status: 'Available' },
                { time: '02:00 PM', status: 'Live', client: 'Sarah Connor' },
                { time: '04:00 PM', status: 'Blocked' },
                { time: '05:30 PM', status: 'Booked', client: 'Mark Verdon' },
              ].map((slot, i) => (
                <div key={i} className={`p-4 rounded-2xl flex items-center justify-between border ${slot.status === 'Live' ? 'border-red-100 bg-red-50/50' : 'border-gray-50 bg-gray-50/30'}`}>
                  <div className="flex items-center space-x-4">
                    <div className="font-bold text-gray-900 text-sm">{slot.time}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${slot.status === 'Booked' ? 'bg-blue-100 text-blue-600' :
                            slot.status === 'Available' ? 'bg-emerald-100 text-emerald-600' :
                              slot.status === 'Live' ? 'bg-red-500 text-white animate-pulse' :
                                'bg-gray-200 text-gray-500'
                          }`}>
                          {slot.status}
                        </span>
                        {slot.client && <span className="text-xs font-bold text-gray-600">{slot.client}</span>}
                      </div>
                    </div>
                  </div>
                  {slot.status === 'Available' && <button className="text-xs font-bold text-blue-600 hover:underline">Edit</button>}
                </div>
              ))}
              <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-bold hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center">
                <Clock size={16} className="mr-2" /> Add More Slots
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Recent Sessions</h3>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-gray-50 rounded-xl text-sm font-bold text-gray-600">All</button>
              <button className="px-4 py-2 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-400">Pending</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Earnings</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK_SESSIONS.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                          {s.partnerName.split(' ')[0][0]}
                        </div>
                        <div className="font-bold text-gray-900">{s.partnerName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-500 font-medium">{s.type} Call</td>
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${s.status === SessionStatus.LIVE ? 'bg-red-100 text-red-600' :
                          s.status === SessionStatus.UPCOMING ? 'bg-amber-100 text-amber-600' :
                            'bg-gray-100 text-gray-500'
                        }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold text-gray-900">${s.price}</td>
                    <td className="px-6 py-5">
                      <button className="text-blue-600 font-bold text-sm hover:underline">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConsultantDashboard;
