import apiClient from './api';

export const healthService = {
  async checkHealth() {
    try {
      const response = await apiClient.get('/api/health');
      return { online: true, data: response.data };
    } catch (error) {
      return { online: false, data: { status: 'OFFLINE_DEMO', message: 'Backend not reachable' } };
    }
  },

  async checkDatabase() {
    try {
      const response = await apiClient.get('/api/db-test');
      return { connected: true, data: response.data };
    } catch (error) {
      return { connected: false, data: { status: 'DISCONNECTED', message: 'PostgreSQL not reachable' } };
    }
  }
};
