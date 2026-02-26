import React, { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import {
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Download,
  Wallet,
  AlertCircle,
} from "lucide-react";
import api from "../../../services/api";

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  status?: string;
}

/* ========== Withdraw Modal ========== */
const WithdrawModal = ({ open, onClose, maxAmount, onWithdraw }) => {
  const [amount, setAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  if (!open) return null;

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount) {
      alert("Invalid amount");
      return;
    }
    setWithdrawing(true);
    try {
      await onWithdraw(parseFloat(amount));
      setAmount("");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-xl space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Withdraw Earnings</h2>
        <p className="text-sm text-gray-500">
          Available Balance: ₹{maxAmount.toFixed(2)}
        </p>

        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={withdrawing}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={withdrawing}
            className="flex-1 px-4 py-3 text-gray-600 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleWithdraw}
            disabled={withdrawing}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            {withdrawing ? "Processing..." : "Withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
};

const MemberEarnings: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      // Fetch bookings to calculate earnings
      const response = await api.get("/enterprise/member/bookings");
      const bookings = Array.isArray(response.data) ? response.data : [];

      // Calculate earnings from COMPLETED bookings
      const totalEarnings = bookings
        .filter((b) => b.status === "COMPLETED")
        .reduce((sum, b) => sum + (b.price || 0), 0);

      setBalance(totalEarnings);

      // Format transactions from bookings
      const txns: Transaction[] = bookings
        .filter((b) => b.status === "COMPLETED")
        .map((b) => ({
          id: b.id,
          amount: b.price || 0,
          type: "credit",
          description: `Session with ${b.user?.email || "Client"}`,
          created_at: b.completed_at || b.date,
          status: "COMPLETED",
        }));

      setTransactions(txns);
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
      setBalance(0);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (amount: number) => {
    try {
      // API call to process withdrawal
      console.log("Withdrawing:", amount);
      setMessage("Withdrawal initiated successfully!");
      setShowWithdrawModal(false);
      setTimeout(() => setMessage(""), 3000);
      // Refresh balance
      fetchEarnings();
    } catch (error) {
      setMessage("Failed to process withdrawal");
    }
  };

  const completedSessions = transactions.filter(
    (t) => t.status === "COMPLETED"
  ).length;

  const todayEarnings = transactions
    .filter((t) => {
      const txDate = new Date(t.created_at).toDateString();
      const today = new Date().toDateString();
      return txDate === today;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <Layout title="Earnings & Payouts">
        <div className="p-8">
          <p className="text-gray-500">Loading earnings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Earnings & Payouts">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Earnings & Payouts</h1>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Wallet size={20} />
            Withdraw Funds
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.includes("successfully")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            <AlertCircle size={20} />
            {message}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-semibold">TOTAL EARNINGS</p>
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">₹{balance.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-semibold">TODAY'S EARNINGS</p>
              <Calendar className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">₹{todayEarnings.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-semibold">COMPLETED SESSIONS</p>
              <ArrowUpRight className="text-purple-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{completedSessions}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-semibold">AVAILABLE BALANCE</p>
              <Wallet className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-green-600">₹{balance.toLocaleString()}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold mb-6">Transaction History</h2>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto mb-4 text-gray-400" size={40} />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">{tx.description}</td>
                      <td className="py-4 px-4">
                        <span className="flex items-center gap-1">
                          {tx.type === "credit" ? (
                            <ArrowUpRight className="text-green-600" size={16} />
                          ) : (
                            <ArrowDownRight className="text-red-600" size={16} />
                          )}
                          {tx.type === "credit" ? "Credit" : "Debit"}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold">
                        <span className={tx.type === "credit" ? "text-green-600" : "text-red-600"}>
                          {tx.type === "credit" ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          {tx.status || "Completed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <WithdrawModal
          open={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          maxAmount={balance}
          onWithdraw={handleWithdraw}
        />
      </div>
    </Layout>
  );
};

export default MemberEarnings;