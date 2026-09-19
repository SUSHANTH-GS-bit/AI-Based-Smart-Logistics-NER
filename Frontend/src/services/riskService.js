import apiClient, { IS_DEMO_MODE } from './api';
import { MOCK_ML_PREDICTION } from '../data/mockData';

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
