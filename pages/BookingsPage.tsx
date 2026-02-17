
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { MOCK_SESSIONS } from '../constants';
import { Calendar, Video, MessageSquare, Phone, MoreVertical, Filter, ChevronRight } from 'lucide-react';

const BookingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');

  const filteredSessions = MOCK_SESSIONS.filter(s => {
    if (activeTab === 'UPCOMING') return s.status === 'UPCOMING' || s.status === 'LIVE';
    return s.status === activeTab;
  });

  return (
    <Layout title="My Bookings">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex p-1 bg-gray-100 rounded-2xl w-full sm:w-auto">
            {['UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
                  activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="flex items-center space-x-2 text-sm font-bold text-gray-500 bg-white border border-gray-100 px-4 py-2 rounded-xl hover:bg-gray-50">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>

        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div key={session.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:border-blue-200 transition-all group">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                {session.type === 'Video' ? <Video size={28} /> : 
                 session.type === 'Audio' ? <Phone size={28} /> : 
                 <MessageSquare size={28} />}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">{session.partnerName}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter mx-auto md:mx-0 ${
                    session.status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 
                    session.status === 'UPCOMING' ? 'bg-blue-100 text-blue-600' : 
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {session.status}
                  </span>
                </div>
                <p className="text-gray-500 font-medium">{session.domain}</p>
              </div>

              <div className="px-6 border-x border-gray-50 hidden lg:block">
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Date & Time</p>
                <p className="font-bold text-gray-900">{session.startTime}</p>
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                  {session.status === 'LIVE' ? 'Join Now' : 'Details'}
                </button>
                <button className="p-3 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          ))}

          {filteredSessions.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
              <Calendar className="mx-auto text-gray-200 mb-4" size={64} />
              <h4 className="text-xl font-bold text-gray-900">No sessions found</h4>
              <p className="text-gray-500 mt-1">Try changing your filters or book a new session.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BookingsPage;
