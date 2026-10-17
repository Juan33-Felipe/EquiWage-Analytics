import { API_ENDPOINTS } from '@equiwage/shared';
import { apiRequest } from './http.client';

/**
 * REST API client for the Anonymized AI Executive Diagnostics module (RF-007).
 */
export const aiApi = {
  /** GET /api/ai/status */
  getStatus() {
    return apiRequest('/api/ai/status', { method: 'GET' });
  },

  /** GET /api/ai/anonymized-preview */
  getAnonymizedPreview({ department = 'all', level = 'all' } = {}) {
    const query = new URLSearchParams({
      department: String(department),
      level: String(level),
    }).toString();
    return apiRequest(`/api/ai/anonymized-preview?${query}`, { method: 'GET' });
  },

  /** POST /api/ai/diagnostics */
  generateDiagnostics({ language = 'en', departmentFilter = 'all', levelFilter = 'all' } = {}) {
    return apiRequest(API_ENDPOINTS.AI_DIAGNOSTICS, {
      method: 'POST',
      body: {
        language,
        departmentFilter,
        levelFilter,
      },
    });
  },
};
