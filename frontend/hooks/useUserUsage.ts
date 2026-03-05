import { useState, useEffect } from 'react';
import { subscriptions } from '../services/api.js';

export const useUserUsage = () => {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const data = await subscriptions.getUsageMetrics();
        setUsage(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch usage metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  return { usage, loading, error };
};
