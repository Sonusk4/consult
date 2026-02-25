import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Download,
  PieChart,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../App";
import { consultants as consultantsApi } from "../services/api";
/* ----------------------------------------------------
   Payout Method Modal
---------------------------------------------------- */
const PayoutMethodModal = ({ open, onClose, onSave }) => {
  const [method, setMethod] = useState("Visa •••• 9012");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-xl space-y-6">
        <h2 className="text-xl font-black text-gray-900">Change Payout Method</h2>

        <div className="space-y-3">
          {["Visa •••• 9012", "Mastercard •••• 5521", "PayPal"].map((m) => (
            <div
              key={m}
              onClick={() => setMethod(m)}
              className={`p-4 rounded-xl border cursor-pointer font-bold ${
                method === m
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {m}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button className="px-4 py-2 text-gray-500 font-bold" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black shadow-lg"
            onClick={() => {
              onSave(method);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   Withdraw Amount Modal
---------------------------------------------------- */
const WithdrawModal = ({ open, onClose, maxAmount, onWithdraw }) => {
  const [amount, setAmount] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-xl space-y-6">
        
        <h2 className="text-xl font-black text-gray-900">Withdraw Funds</h2>

        <p className="text-sm text-gray-500 font-bold -mt-4">
          Available: ₹{maxAmount}
        </p>

        <input
          type="number"
          placeholder="Enter amount"
          className="w-full p-4 rounded-xl border border-gray-200 font-bold"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {Number(amount) > Number(maxAmount) && (
          <p className="text-red-500 text-xs font-bold">
            Amount exceeds available balance.
          </p>
        )}

        <div className="flex items-center justify-end space-x-3">
          <button className="px-4 py-2 text-gray-500 font-bold" onClick={onClose}>
            Cancel
          </button>
          <button
            disabled={!amount || Number(amount) > Number(maxAmount)}
            className={`px-6 py-2 rounded-xl font-black shadow-lg text-white ${
              amount && Number(amount) <= Number(maxAmount)
                ? "bg-blue-600"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={() => {
              onWithdraw(amount);
              onClose();
            }}
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   MAIN PAGE
---------------------------------------------------- */
const EarningsPage: React.FC = () => {
  const { user, setUser } = useAuth();  // CORRECT PLACE

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  const [payoutMethod, setPayoutMethod] = useState("Visa •••• 9012");
  const [openPayoutModal, setOpenPayoutModal] = useState(false);

  const [openWithdrawModal, setOpenWithdrawModal] = useState(false);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get("/consultant/earnings");
        setData(res.data);
      } catch (err) {
        setError("Failed to load earnings data");
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  if (loading)
    return (
      <Layout title="Finances">
        <p className="p-10">Loading...</p>
      </Layout>
    );

  if (error)
    return (
      <Layout title="Finances">
        <p className="p-10 text-red-500">{error}</p>
      </Layout>
    );

  /* -------------------------------------------
     DYNAMIC STATS CARDS
  -------------------------------------------- */
  const totalRevenue = data?.reduce((sum: number, item: any) => sum + (item.revenue || 0), 0) || 0;
  
  const statsCards = [
    {
      label: "Total Revenue",
      value: `₹${totalRevenue}`,
      change: "+12%",
      up: true,
      icon: <span className="text-2xl">₹</span>,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Withdrawable",
      value: `₹${totalRevenue}`,
      change: "Ready",
      up: true,
      icon: <TrendingUp size={24} />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Avg. per Session",
      value: `₹${data?.length > 0 ? Math.round(totalRevenue / data.length) : 0}`,
      change: "+8%",
      up: true,
      icon: <PieChart size={24} />,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Pending Payout",
      value: "₹0",
      change: "—",
      up: true,
      icon: <Calendar size={24} />,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <Layout title="Finances">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Stats Cards */}
        <div className="grid lg:grid-cols-4 gap-6">
          {statsCards.map((card, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group"
            >
              <div
                className={`${card.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}
              >
                {card.icon}
              </div>

              <p className="text-4xl font-black text-gray-900 mb-2">
                {card.value}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  {card.label}
                </p>
                <div
                  className={`flex items-center text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                    card.up
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {card.up ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}{" "}
                  {card.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Earnings Trend + Reports Area */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* Earnings Trend */}
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                  Earnings Trend
                </h3>
              </div>

              <div className="h-64 flex items-end justify-between space-x-2">
                {data?.map((item: any, i: number) => (
                  <div key={i} className="flex-1 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      ₹{item.revenue}
                    </div>
                    <div
                      className="bg-blue-100 rounded-t-lg transition-all group-hover:bg-blue-600"
                      style={{ height: `${item.revenue > 0 ? (item.revenue / (totalRevenue || 1)) * 100 : 5}%` }}
                    ></div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-6 px-2">
                {data?.map((item: any, i: number) => (
                  <span
                    key={i}
                    className="text-[10px] font-black text-gray-400 uppercase"
                  >
                    {item.name.slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side Card Area */}
          <div className="space-y-6">

            {/* Withdraw Funds */}
            <div className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Withdraw Funds</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  Securely transfer your earnings to your bank account or PayPal.
                </p>

                <div className="bg-white/10 p-6 rounded-3xl border border-white/10 mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">
                    Your payout method
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{payoutMethod}</p>
                    <button
                      className="text-[10px] font-black uppercase text-blue-400"
                      onClick={() => setOpenPayoutModal(true)}
                    >
                      Change
                    </button>
                  </div>
                </div>

                <button
                  className="w-full bg-blue-600 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/50"
                  onClick={() => setOpenWithdrawModal(true)}
                >
                  Withdraw ₹{totalRevenue}
                </button>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Reports */}
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6">
                Reports
              </h3>

              <div className="space-y-3">
                <p className="text-gray-500 text-sm text-center py-8">
                  No reports available yet
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODALS */}
      <PayoutMethodModal
        open={openPayoutModal}
        onClose={() => setOpenPayoutModal(false)}
        onSave={(method) => setPayoutMethod(method)}
      />

      <WithdrawModal
        open={openWithdrawModal}
        onClose={() => setOpenWithdrawModal(false)}
        maxAmount={totalRevenue}
        onWithdraw={(amount) => {
          console.log("WITHDRAW:", amount);
          alert(`Withdrawal request of ₹${amount} submitted!`);
        }}
      />
    </Layout>
  );
};

export default EarningsPage;