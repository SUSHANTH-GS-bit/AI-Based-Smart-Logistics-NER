import apiClient, { IS_DEMO_MODE } from './api';
import { MOCK_ML_PREDICTION } from '../data/mockData';

export const routeService = {
  async calculateRoute(origin, destination, options = {}) {
    if (IS_DEMO_MODE) {
      return {
        data: {
          status: 'SUCCESS',
          primaryRoute: {
            name: `${origin} → ${destination} Mountain Highway`,
            distanceKm: 417,
            eta: '8h 45m',
            riskLevel: 'HIGH',
            riskScore: 72,
            roadCondition: 'Monsoon Saturated Tarmac',
          },
          alternativeRoute: MOCK_ML_PREDICTION.recommendedAlternative,
        }
      };
    }
    try {
      const response = await apiClient.post('/api/gis/routes', {
        source_latitude: options.originLat || 24.817,
        source_longitude: options.originLng || 93.936,
        destination_latitude: options.destLat || 26.144,
        destination_longitude: options.destLng || 91.736,
      });
      return response;
    } catch (error) {
      return {
        data: {
          status: 'DEMO_FALLBACK',
          primaryRoute: {
            name: `${origin} → ${destination} Main Trunk`,
            distanceKm: 417,
            eta: '8h 45m',
            riskLevel: 'HIGH',
            riskScore: 72,
          },
          alternativeRoute: MOCK_ML_PREDICTION.recommendedAlternative,
        }
      };
    }
  }
};

export const riskService = {
  async getRiskPrediction(params) {
    if (IS_DEMO_MODE) {
      return { data: MOCK_ML_PREDICTION };
    }
    try {
      const response = await apiClient.post('/api/ml/predict', params);
      return response;
    } catch (error) {
      return { data: MOCK_ML_PREDICTION };
    }
  }
};

export const accessibilityService = {
  async getNearbyFacilities(category, radiusKm = 10) {
    // Returns filtered facility mock dataset
    return { data: [] };
  }
};

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
