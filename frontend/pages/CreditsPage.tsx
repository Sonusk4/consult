
import React from 'react';
import Layout from '../components/Layout';
import { CreditCard, Plus, ArrowUpRight, History, Zap, ShieldCheck } from 'lucide-react';

const CreditsPage: React.FC = () => {
  return (
    <Layout title="Credits & Billing">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Current Balance Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-[32px] p-8 text-white relative overflow-hidden h-full shadow-2xl">
              <div className="relative z-10">
                <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="text-blue-400" size={24} />
                </div>
                <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-2">Available Balance</p>
                <h2 className="text-5xl font-black mb-6">1,250 <span className="text-xl font-normal text-blue-300 tracking-normal">Credits</span></h2>
                <div className="pt-6 border-t border-white/10 flex items-center space-x-2 text-emerald-400">
                  <ShieldCheck size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Safe & Secured Wallet</span>
                </div>
              </div>
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Buy Credits Packs */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Purchase Credit Packs</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { amount: 500, price: 49, bonus: 0, tag: 'Starter' },
                { amount: 1200, price: 99, bonus: 200, tag: 'Popular', highlight: true },
                { amount: 3000, price: 199, bonus: 800, tag: 'Value' },
              ].map((pack, i) => (
                <div key={i} className={`p-6 rounded-3xl border transition-all cursor-pointer group ${pack.highlight ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-xl shadow-blue-100' : 'bg-white text-gray-900 border-gray-100 hover:border-blue-300'
                  }`}>
                  {pack.highlight && <div className="bg-white text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase mb-4 inline-block">Best Value</div>}
                  <p className="text-sm font-bold uppercase tracking-widest opacity-60 mb-1">{pack.tag}</p>
                  <h4 className="text-3xl font-black mb-1">{pack.amount}</h4>
                  <p className={`text-xs font-bold mb-6 ${pack.highlight ? 'text-blue-100' : 'text-gray-400'}`}>+ {pack.bonus} Bonus Credits</p>
                  <div className={`text-2xl font-black mb-6 ${pack.highlight ? 'text-white' : 'text-blue-600'}`}>${pack.price}</div>
                  <button className={`w-full py-3 rounded-xl font-bold transition-all ${pack.highlight ? 'bg-white text-blue-600 hover:bg-gray-50' : 'bg-gray-50 text-gray-900 group-hover:bg-blue-600 group-hover:text-white'
                    }`}>
                    Buy Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="text-gray-400" size={20} />
              <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
            </div>
            <button className="text-sm font-bold text-blue-600 hover:underline">Download Statement</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { id: 'TXN-9201', desc: 'Credit Pack Purchase - Popular', date: 'Oct 20, 2023', status: 'Success', val: '+1,200', color: 'text-emerald-600' },
                  { id: 'TXN-8812', desc: 'Session Booking: Dr. Sarah Smith', date: 'Oct 19, 2023', status: 'Success', val: '-150', color: 'text-red-600' },
                  { id: 'TXN-7721', desc: 'Credit Pack Purchase - Starter', date: 'Oct 15, 2023', status: 'Success', val: '+500', color: 'text-emerald-600' },
                ].map((txn, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-5 text-sm font-mono text-gray-500">{txn.id}</td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-gray-900 text-sm">{txn.desc}</p>
                      <p className="text-xs text-gray-400">{txn.date}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-full uppercase">Completed</span>
                    </td>
                    <td className={`px-6 py-5 font-black ${txn.color}`}>{txn.val}</td>
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

export default CreditsPage;
