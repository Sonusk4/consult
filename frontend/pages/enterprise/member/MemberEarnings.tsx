import React, { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import { wallet } from "../../../services/api";

interface Transaction {
  id: number;
  amount: number;
  type: string; // "credit" | "debit"
  created_at: string;
}

const MemberEarnings: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const balanceRes = await wallet.getBalance();
        const txRes = await wallet.getTransactions();

        // Handle balance safely
        if (balanceRes && typeof balanceRes.balance === "number") {
          setBalance(balanceRes.balance);
        } else {
          setBalance(0);
        }

        // Ensure transactions is always array
        if (Array.isArray(txRes)) {
          setTransactions(txRes);
        } else if (Array.isArray(txRes?.transactions)) {
          setTransactions(txRes.transactions);
        } else if (Array.isArray(txRes?.data)) {
          setTransactions(txRes.data);
        } else {
          setTransactions([]);
        }

      } catch (error) {
        console.error("Failed to fetch earnings:", error);
        setBalance(0);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  // Calculate total credits dynamically
  const totalCredits = transactions
    .filter((tx) => tx.type === "credit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">My Earnings</h1>

        {loading ? (
          <p className="text-gray-500">Loading earnings...</p>
        ) : (
          <>
            {/* Balance Summary Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow">
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ₹ {balance}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <p className="text-sm text-gray-500">Total Credits</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  ₹ {totalCredits}
                </p>
              </div>
            </div>

            {/* Transaction History */}
            <h2 className="text-lg font-semibold mb-4">
              Transaction History
            </h2>

            {!Array.isArray(transactions) || transactions.length === 0 ? (
              <div className="bg-white p-6 rounded-xl shadow">
                <p>No transactions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white p-6 rounded-xl shadow flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold capitalize">
                        {tx.type}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <p
                      className={`font-bold ${
                        tx.type === "credit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"} ₹ {tx.amount}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default MemberEarnings;