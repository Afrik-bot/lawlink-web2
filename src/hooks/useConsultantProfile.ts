import { useState, useEffect } from 'react';
import axios from 'axios';
import { ConsultantProfile } from '../types/consultant';

interface UseConsultantProfileProps {
  consultantId: string;
}

interface UseConsultantProfileReturn {
  profile: ConsultantProfile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useConsultantProfile = ({ consultantId }: UseConsultantProfileProps): UseConsultantProfileReturn => {
  const [profile, setProfile] = useState<ConsultantProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<ConsultantProfile>(`/api/consultants/${consultantId}/profile`);
      setProfile(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch consultant profile'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (consultantId) {
      fetchProfile();
    }
  }, [consultantId]);

  const refetch = async () => {
    await fetchProfile();
  };

  return {
    profile,
    loading,
    error,
    refetch
  };
};
