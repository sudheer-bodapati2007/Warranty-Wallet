import { useEffect, useRef, useState } from 'react';
import { searchProductImagesApi } from '../services/api';

/**
 * Debounced product image search with request ordering protection.
 * Older responses are ignored if a newer search has started.
 */
export function useProductImageSearch(query, options = {}) {
  const { minLength = 3, delay = 500 } = options;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const normalizedQuery = (query || '').trim().toLowerCase();

  useEffect(() => {
    if (normalizedQuery.length < minLength) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    const currentRequestId = ++requestId.current;

    const timer = setTimeout(async () => {
      try {
        const response = await searchProductImagesApi(normalizedQuery);
        if (currentRequestId !== requestId.current) return;

        if (response.success) {
          setResults(response.data || []);
          setError('');
        } else {
          setResults([]);
          setError(response.message || 'No product images found.');
        }
      } catch (err) {
        if (currentRequestId !== requestId.current) return;
        setResults([]);
        setError(err.response?.data?.message || 'Unable to search for product images right now.');
      } finally {
        if (currentRequestId === requestId.current) {
          setLoading(false);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [normalizedQuery, minLength, delay]);

  return { results, loading, error };
}
