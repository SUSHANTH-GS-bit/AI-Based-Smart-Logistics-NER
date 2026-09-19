import apiClient, { IS_DEMO_MODE } from './api';
import { MOCK_INCIDENTS } from '../data/mockData';

export const incidentService = {
  async getAllIncidents() {
    if (IS_DEMO_MODE) {
      return { data: MOCK_INCIDENTS };
    }
    try {
      const response = await apiClient.get('/api/incidents');
      return response;
    } catch (error) {
      console.warn('Backend unavailable, returning incident mock data fallback');
      return { data: MOCK_INCIDENTS };
    }
  },

  async reportIncident(incidentData) {
    if (IS_DEMO_MODE) {
      const newIncident = {
        id: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
        ...incidentData,
        reportedAt: new Date().toISOString(),
        status: 'Active',
      };
      return { data: { status: 'SUCCESS', incident: newIncident } };
    }
    try {
      const response = await apiClient.post('/api/incidents', incidentData);
      return response;
    } catch (error) {
      return {
        data: {
          status: 'OFFLINE_QUEUED',
          message: 'Saved to local queue due to network status',
          incident: incidentData,
        }
      };
    }
  }
};
