import apiClient, { IS_DEMO_MODE } from './api';
import { MOCK_FACILITIES } from '../data/mockData';

export const accessibilityService = {
  async getNearbyFacilities(category, radiusKm = 10) {
    if (IS_DEMO_MODE) {
      const filtered = MOCK_FACILITIES.filter(
        (f) => (category === 'All' || f.category === category) && (f.distanceKm || 5) <= radiusKm
      );
      return { data: filtered };
    }
    try {
      const response = await apiClient.get(`/api/gis/facilities?category=${category}&radius=${radiusKm}`);
      return response;
    } catch (error) {
      const filtered = MOCK_FACILITIES.filter(
        (f) => (category === 'All' || f.category === category) && (f.distanceKm || 5) <= radiusKm
      );
      return { data: filtered };
    }
  }
};
