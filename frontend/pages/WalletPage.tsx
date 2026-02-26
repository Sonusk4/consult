import React, { useState, useEffect } from 'react';
import { Wallet, Plus, History, IndianRupee, Loader } from 'lucide-react';
import api from '../services/api';

interface CreditPackage {
  id: number;
  amount: number;
  bonus: number;
  is_active: boolean;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  status: string;
}

interface WalletData {
  balance: number;
  user_id: number;
}

const WalletPage: React.FC = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
    fetchCreditPackages();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await api.get('/wallet');
      setWallet(response.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchCreditPackages = async () => {
    try {
      const response = await api.get('/credit-packages');
      setCreditPackages(response.data);
    } catch (error) {
      console.error('Error fetching credit packages:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async (packageId: number, amount: number) => {
    setPaymentProcessing(true);

    try {
      // Step 1: Create Razorpay order
      const orderResponse = await api.post('/payment/create-order', {
        amount: amount,
        package_id: packageId
      });

      const orderData = orderResponse.data;

      if (!orderData?.order_id) {
        throw new Error(orderData?.error || 'Failed to create payment order');
      }

      // Step 2: Redirect to backend payment page
      // Backend will handle Razorpay checkout and redirect back after payment
      window.location.href = `http://localhost:5000/payment-page?order_id=${orderData.order_id}&amount=${amount}&credits=${packageId}`;

    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
      setPaymentProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'CREDIT': return 'text-green-600';
      case 'DEBIT': return 'text-red-600';
      case 'EARNING': return 'text-blue-600';
      case 'COMMISSION': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
          <Wallet className="mr-3" />
          My Wallet
        </h1>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg opacity-90">Current Balance</p>
              <p className="text-4xl font-bold flex items-center">
                <IndianRupee className="w-8 h-8 mr-2" />
                {wallet?.balance || 0}
              </p>
            </div>
            <button
              onClick={() => setShowAddCredits(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg flex items-center hover:bg-gray-100 transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Credits
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowAddCredits(true)}
            className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition flex items-center justify-center"
          >
            <Plus className="w-6 h-6 mr-2" />
            Add Credits
          </button>
          <button
            onClick={() => setShowTransactions(true)}
            className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition flex items-center justify-center"
          >
            <History className="w-6 h-6 mr-2" />
            Transaction History
          </button>
        </div>

        {/* Add Credits Modal */}
        {showAddCredits && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Add Credits</h2>
                <button
                  onClick={() => setShowAddCredits(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creditPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="border rounded-lg p-4 hover:border-blue-500 transition"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-2xl font-bold text-gray-800">
                          ₹{pkg.amount}
                        </p>
                        {pkg.bonus > 0 && (
                          <p className="text-green-600 font-semibold">
                            + ₹{pkg.bonus} Bonus
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-xl font-bold text-blue-600">
                          ₹{pkg.amount + pkg.bonus}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddCredits(pkg.id, pkg.amount)}
                      disabled={paymentProcessing}
                      className={`w-full py-2 rounded-lg font-bold transition-all flex items-center justify-center ${paymentProcessing
                        ? 'bg-gray-300 text-gray-500 cursor-wait'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      {paymentProcessing ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Pay Now'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transaction History Modal */}
        {showTransactions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Transaction History</h2>
                <button
                  onClick={() => setShowTransactions(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No transactions found</p>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'CREDIT' || transaction.type === 'EARNING' ? '+' : '-'}
                            ₹{transaction.amount}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {transaction.type.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
