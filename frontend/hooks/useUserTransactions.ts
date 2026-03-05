import { useState, useEffect } from 'react';
<<<<<<< HEAD
import api from '../services/api';

export interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export const useUserTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
=======
import { wallet } from '../services/api.js';

export const useUserTransactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
>>>>>>> acfa90b6fb3a5a6d7595d2b43f91dc8baae26c76
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
<<<<<<< HEAD
      setLoading(true);
      try {
        const response = await api.get('/transactions');
        setTransactions(response.data || []);
        setError(null);
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || err?.message || 'Failed to fetch transactions';
        setError(errorMsg);
        setTransactions([]);
=======
      try {
        const data = await wallet.getTransactions();
        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
>>>>>>> acfa90b6fb3a5a6d7595d2b43f91dc8baae26c76
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return { transactions, loading, error };
};
