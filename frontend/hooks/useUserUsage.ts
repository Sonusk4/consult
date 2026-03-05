import { useState, useEffect } from 'react';
import { subscriptions } from '../services/api';

export interface UserUsage {
  chat_messages_used: number;
  chat_limit: number;
  bookings_made: number;
  days_remaining: number;
  plan: string;
  bonus_balance: number;
}

export const useUserUsage = () => {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      setLoading(true);
      try {
        const data = await subscriptions.getUsageMetrics();
        setUsage(data || null);
        setError(null);
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || err?.message || 'Failed to fetch usage metrics';
        setError(errorMsg);
        setUsage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  return { usage, loading, error };
};
