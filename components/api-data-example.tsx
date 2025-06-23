import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

/**
 * Example component that fetches data from the backend API
 */
export const ApiDataExample = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // This will use the NEXT_PUBLIC_API_URL environment variable
        const result = await api.get('users');
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>API Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};
