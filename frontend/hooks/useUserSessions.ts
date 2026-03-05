import { useState, useEffect } from 'react';
import { bookings } from '../services/api.js';
import { Booking } from '../types';

export const useUserSessions = () => {
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await bookings.getAll();
        setSessions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return { sessions, loading, error };
};
