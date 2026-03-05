import { useState, useEffect, useCallback } from 'react';
import { wallet } from '../services/api.js';

export const useWalletBalance = () => {
  const [balance, setBalance] = useState<number>(0);
  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const data = await wallet.getBalance();
      setBalance(data.balance || 0);
      setBonusBalance(data.bonus_balance || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet balance');
      setBalance(0);
      setBonusBalance(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Add a refresh function that can be called manually
  const refresh = useCallback(() => {
    setLoading(true);
    fetchBalance();
  }, [fetchBalance]);

  return { balance, bonusBalance, loading, error, refresh };
};
