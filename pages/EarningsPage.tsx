
import React from 'react';
import Layout from '../components/Layout';
import { TrendingUp, ArrowDownRight, ArrowUpRight, Calendar, Download, PieChart } from 'lucide-react';

const EarningsPage: React.FC = () => {
  return (
    <Layout title="Finances">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="grid lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', value: '₹45,200', change: '+24%', up: true, icon: <span className="text-2xl">₹</span>, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Withdrawable', value: ' ₹2,840', change: 'Ready', up: true, icon: <TrendingUp size={24} />, color: 'bg-blue-50 text-blue-600' },
            { label: 'Avg. per Session', value: '₹180', change: '-4%', up: false, icon: <PieChart size={24} />, color: 'bg-purple-50 text-purple-600' },
            { label: 'Pending Payout', value: '₹1,250', change: 'Friday', up: true, icon: <Calendar size={24} />, color: 'bg-amber-50 text-amber-600' },
          ].map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className={`${card.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                {card.icon}
              </div>
              <p className="text-4xl font-black text-gray-900 mb-2">{card.value}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{card.label}</p>
                <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-full uppercase ${card.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {card.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Earnings Trend</h3>
                 <div className="flex p-1 bg-gray-50 rounded-xl">
                   {['Week', 'Month', 'Year'].map(t => (
                     <button key={t} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${t === 'Month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>{t}</button>
                   ))}
                 </div>
               </div>
               <div className="h-64 flex items-end justify-between space-x-2">
                 {[40, 70, 45, 90, 65, 80, 55, 75, 50, 85, 95, 60].map((h, i) => (
                   <div key={i} className="flex-1 group relative">
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">₹{h * 10}</div>
                     <div className="bg-blue-100 rounded-t-lg transition-all group-hover:bg-blue-600" style={{ height: `₹{h}%` }}></div>
                   </div>
                 ))}
               </div>
               <div className="flex justify-between mt-6 px-2">
                 {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                   <span key={m} className="text-[10px] font-black text-gray-400 uppercase">{m}</span>
                 ))}
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-2">Withdraw Funds</h3>
                 <p className="text-gray-400 text-sm mb-8 leading-relaxed">Securely transfer your earnings to your bank account or PayPal.</p>
                 <div className="bg-white/10 p-6 rounded-3xl border border-white/10 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Your payout method</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold">Visa •••• 9012</p>
                      <button className="text-[10px] font-black uppercase text-blue-400">Change</button>
                    </div>
                 </div>
                 <button className="w-full bg-blue-600 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/50">
                    Withdraw ₹2,840.00
                 </button>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
               <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6">Reports</h3>
               <div className="space-y-3">
                 {[
                   { name: 'Q3 Financial Audit.pdf', date: 'Oct 01, 2023' },
                   { name: 'Monthly Payout Sep.csv', date: 'Sep 05, 2023' },
                   { name: 'Annual Tax Summary.pdf', date: 'Jan 10, 2023' },
                 ].map((file, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-blue-50 transition-all cursor-pointer">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:text-blue-600 shadow-sm"><Download size={18} /></div>
                       <div>
                         <p className="text-xs font-black text-gray-900 uppercase truncate max-w-[120px]">{file.name}</p>
                         <p className="text-[10px] text-gray-400 font-bold">{file.date}</p>
                       </div>
                     </div>
                     <ArrowUpRight size={16} className="text-gray-300" />
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

export default EarningsPage;
