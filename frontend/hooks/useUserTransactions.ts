import { useState, useEffect } from 'react';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await api.get('/transactions');
        setTransactions(response.data || []);
        setError(null);
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || err?.message || 'Failed to fetch transactions';
        setError(errorMsg);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return { transactions, loading, error };
};
