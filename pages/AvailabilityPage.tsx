
import React from 'react';
import Layout from '../components/Layout';
import { Clock, Plus, Trash2, Edit3, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const AvailabilityPage: React.FC = () => {
  return (
    <Layout title="Work Schedule">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Calendar Header */}
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600">
              <Calendar size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">October 2023</h2>
              <div className="flex items-center space-x-4 mt-1">
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-all"><ChevronLeft size={18} /></button>
                <span className="text-sm font-black text-blue-600 uppercase tracking-widest">Today</span>
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-all"><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>
          <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all">
            <Plus size={20} className="mr-2" /> Bulk Add Slots
          </button>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div key={day} className={`p-6 rounded-[32px] border transition-all ${
              day === 'Tue' ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' : 'bg-white border-gray-100'
            }`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${day === 'Tue' ? 'text-blue-100' : 'text-gray-400'}`}>{day}</p>
              <h3 className="text-2xl font-black">{22 + i}</h3>
              <div className="mt-4 space-y-2">
                {[1, 2].map(s => (
                  <div key={s} className={`h-1.5 rounded-full ${day === 'Tue' ? 'bg-white/30' : 'bg-blue-100'}`}></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Day Slots */}
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Slots for Tuesday, Oct 24</h3>
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-500">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>3 Slots Available</span>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { time: '09:00 AM - 10:00 AM', type: 'Morning Session', status: 'Booked', client: 'Alex J.' },
              { time: '11:30 AM - 12:30 PM', type: 'Consultation', status: 'Available' },
              { time: '02:00 PM - 03:00 PM', type: 'Strategy Call', status: 'Available' },
              { time: '04:30 PM - 05:30 PM', type: 'Review', status: 'Blocked' },
            ].map((slot, i) => (
              <div key={i} className={`p-6 rounded-[28px] border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
                slot.status === 'Booked' ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-transparent hover:border-gray-200'
              }`}>
                <div className="flex items-center space-x-6">
                  <div className={`p-4 rounded-2xl ${slot.status === 'Booked' ? 'bg-white text-blue-600' : 'bg-white text-gray-400'}`}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-lg leading-none mb-1">{slot.time}</p>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{slot.type}</span>
                      {slot.client && <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">CLIENT: {slot.client}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {slot.status === 'Available' ? (
                    <button className="text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-widest px-4 py-2">Delete</button>
                  ) : (
                    <button className="text-xs font-black text-blue-600 uppercase tracking-widest px-4 py-2 bg-white rounded-xl shadow-sm border border-blue-50">View Details</button>
                  )}
                  {slot.status === 'Available' && (
                    <button className="bg-white border border-gray-100 text-gray-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Edit Slot</button>
                  )}
                </div>
              </div>
            ))}
            
            <button className="w-full py-6 border-4 border-dashed border-gray-50 rounded-[28px] text-gray-300 font-black text-lg hover:border-blue-200 hover:text-blue-400 transition-all flex items-center justify-center">
              <Plus size={24} className="mr-3" /> Click to add a new slot for this day
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AvailabilityPage;
