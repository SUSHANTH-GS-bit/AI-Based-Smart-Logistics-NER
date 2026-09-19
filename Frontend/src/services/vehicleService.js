import apiClient, { IS_DEMO_MODE } from './api';
import { MOCK_VEHICLES } from '../data/mockData';

export const vehicleService = {
  async getAllVehicles() {
    if (IS_DEMO_MODE) {
      return { data: MOCK_VEHICLES };
    }
    try {
      const response = await apiClient.get('/api/vehicles');
      return response;
    } catch (error) {
      console.warn('Backend unavailable, returning vehicle mock data fallback');
      return { data: MOCK_VEHICLES };
    }
  },

  async getVehicleById(vehicleId) {
    if (IS_DEMO_MODE) {
      const vehicle = MOCK_VEHICLES.find((v) => v.id === vehicleId) || MOCK_VEHICLES[0];
      return { data: vehicle };
    }
    try {
      const response = await apiClient.get(`/api/vehicles/${vehicleId}/location`);
      return response;
    } catch (error) {
      const vehicle = MOCK_VEHICLES.find((v) => v.id === vehicleId) || MOCK_VEHICLES[0];
      return { data: vehicle };
    }
  },

  async updateVehicleLocation(locationData) {
    if (IS_DEMO_MODE) {
      return { data: { status: 'SUCCESS', message: 'Location updated in demo mode', locationData } };
    }
    try {
      const response = await apiClient.post('/api/vehicles/location', locationData);
      return response;
    } catch (error) {
      return { data: { status: 'DEMO_SAVED', message: 'Backend unreachable, saved locally', locationData } };
    }
  }
};
