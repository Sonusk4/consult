import { useState, useEffect } from 'react';
import { bookings as bookingsApi } from '../services/api';
import { Booking } from '../types';

export const useUserSessions = () => {
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const data = await bookingsApi.getAll();
        setSessions(data || []);
        setError(null);
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || err?.message || 'Failed to fetch sessions';
        setError(errorMsg);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return { sessions, loading, error };
};
