import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { usePaymentPopup } from "../../hooks/usePaymentPopup";
import PaymentPopupModal from "../../components/PaymentPopupModal";
import { Zap, ShieldCheck, History, Loader } from "lucide-react";

interface Transaction {
  id: number;
  description: string;
  created_at: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
}

const creditPacks = [
  { price: 500, credits: 500, bonus: 10, bonusPercent: 2, validity: "30 days" },
  { price: 1000, credits: 1000, bonus: 25, bonusPercent: 2.5, validity: "60 days" },
  { price: 2000, credits: 2000, bonus: 100, bonusPercent: 5, validity: "90 days" },
  { price: 5000, credits: 5000, bonus: 350, bonusPercent: 7, validity: "180 days" },
];

const UserCredit: React.FC = () => {
  const { showPaymentSuccess, showPaymentError, popup, hidePaymentPopup } = usePaymentPopup();

  const [walletBalance, setWalletBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
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
      setBonusBalance(res.data.bonus_balance || 0);
    } catch (err) {
      console.error("Wallet fetch failed");
      showPaymentError('Wallet Error', 'Failed to load wallet balance');
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
      showPaymentError('Payment Failed', 'Failed to initiate payment. Please try again.');
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
                Available Main Balance
              </p>
              <h2 className="text-4xl font-bold mb-4">
                ₹{walletBalance.toFixed(2)}
              </h2>
              {bonusBalance > 0 && (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl w-fit border border-emerald-500/20">
                  <Zap size={14} />
                  <span className="text-sm font-bold">₹{bonusBalance.toFixed(2)} Bonus Balance</span>
                </div>
              )}
            </div>
            <Zap className="text-blue-400 opacity-50" size={48} />
          </div>

          <div className="mt-6 flex items-center text-blue-300 text-xs">
            <ShieldCheck size={14} className="mr-2" />
            Tokens can be used for any consultation booking
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
                key={pack.credits}
                className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition text-center"
              >

                <div className="bg-blue-50 text-blue-700 py-2 px-3 rounded-lg mb-4 text-sm font-medium">
                  +{pack.bonus} Bonus Credits ({pack.bonusPercent}%)
                </div>

                <div className="text-left text-xs text-gray-500 space-y-1 mb-6 h-16">
                  <p>• Usable for platform fees only</p>
                  <p>• Valid for {pack.validity}</p>
                  <p>• Non-withdrawable</p>
                </div>

                <div className="text-2xl font-bold text-blue-600 mb-6">
                  ₹{pack.price}
                </div>

                <button
                  onClick={() => handleBuyCredits(pack.credits, pack.price)}
                  disabled={buying === pack.credits}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {buying === pack.credits ? "Processing..." : "Buy Now"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ================= SUBSCRIPTION PLANS ================= */}
    


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

      {/* PaymentPopupModal */}
      <PaymentPopupModal
        open={popup.open}
        title={popup.title}
        message={popup.message}
        icon={popup.icon}
        onClose={hidePaymentPopup}
      />

    </Layout>
  );
};

export default UserCredit;
