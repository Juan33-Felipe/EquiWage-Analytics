import { useCallback, useState } from 'react';
import { aiApi } from '../services/ai.api';

/**
 * Custom hook for generating and inspecting Anonymized AI Executive Diagnostics (RF-007).
 */
export function useAiDiagnostics() {
  const [diagnostic, setDiagnostic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runDiagnostics = useCallback(async ({ language = 'en', department = 'all', level = 'all' } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.generateDiagnostics({
        language,
        departmentFilter: department,
        levelFilter: level,
      });
      setDiagnostic(result);
      return result;
    } catch (err) {
      const message = err?.message || 'Could not generate AI executive diagnostics.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    diagnostic,
    loading,
    error,
    runDiagnostics,
  };
}
