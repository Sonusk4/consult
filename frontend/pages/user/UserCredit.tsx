import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Zap, ShieldCheck, History, Loader } from "lucide-react";

interface Transaction {
  id: number;
  description: string;
  created_at: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
}

const creditPacks = [
  { amount: 500, price: 49, bonus: 0 },
  { amount: 1200, price: 99, bonus: 200 },
  { amount: 3000, price: 199, bonus: 800 },
];

const UserCredit: React.FC = () => {
  const { addToast } = useToast();

  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);

  /* ================= LOAD WALLET ================= */
  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await api.get("/wallet");
      setWalletBalance(res.data.balance || 0);
    } catch (err) {
      console.error("Wallet fetch failed");
      addToast("Failed to load wallet", "error");
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/transactions");
      setTransactions(res.data || []);
    } catch (err) {
      console.error("Transaction fetch failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= ADD CREDITS ================= */
  const handleBuyCredits = async (packAmount: number, packPrice: number) => {
    setBuying(packAmount);

    try {
      // Create order on backend and get payment URL
      const orderResponse = await api.post('/payment/create-order', {
        amount: packPrice,
      });

      if (!orderResponse.data?.order_id) {
        throw new Error('Failed to create payment order');
      }

      // Redirect to backend payment page
      // Backend will handle Razorpay and redirect back after payment
      window.location.href = `http://localhost:5000/payment-page?order_id=${orderResponse.data.order_id}&amount=${packPrice}&credits=${packAmount}`;

    } catch (error) {
      console.error('Payment error:', error);
      addToast('Failed to initiate payment. Please try again.', "error");
      setBuying(null);
    }
  };

  return (
    <Layout title="Credits & Billing">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* ================= WALLET BALANCE ================= */}
        <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-semibold mb-2">
                Available Balance
              </p>
              <h2 className="text-4xl font-bold">
                ₹{walletBalance.toFixed(2)}
              </h2>
            </div>
            <Zap className="text-blue-400" size={36} />
          </div>

          <div className="mt-6 flex items-center text-emerald-400 text-sm">
            <ShieldCheck size={16} className="mr-2" />
            Safe & Secure Wallet
          </div>
        </div>

        {/* ================= BUY CREDIT PACKS ================= */}
        <div>
          <h3 className="text-2xl font-bold mb-6">
            Purchase Credit Packs
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => (
              <div
                key={pack.amount}
                className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition text-center"
              >
                <h4 className="text-3xl font-bold mb-2">
                  {pack.amount}
                </h4>

                <p className="text-gray-500 text-sm mb-4">
                  + {pack.bonus} Bonus Credits
                </p>

                <div className="text-2xl font-bold text-blue-600 mb-6">
                  ₹{pack.price}
                </div>

                <button
                  onClick={() => handleBuyCredits(pack.amount, pack.price)}
                  disabled={buying === pack.amount}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {buying === pack.amount ? "Processing..." : "Buy Now"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ================= TRANSACTION HISTORY ================= */}
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center">
            <History className="text-gray-400 mr-2" size={20} />
            <h3 className="text-xl font-bold">
              Recent Transactions
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader className="animate-spin text-blue-600" size={30} />
            </div>
          ) : (
            <div className="divide-y">
              {transactions.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No transactions yet.
                </div>
              )}

              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="p-6 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {txn.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`font-bold ${txn.type === "CREDIT"
                        ? "text-emerald-600"
                        : "text-red-600"
                      }`}
                  >
                    {txn.type === "CREDIT" ? "+" : "-"}
                    {txn.amount}
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

export default UserCredit;
