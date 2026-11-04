import { apiClient } from './apiClient';
import { SpringPageResponse, SearchHistoryModel, SearchQualityStats } from '@/types/history';

export const historyApi = {
  // 👎 피드백을 받은 검색 기록 페이지 조회
  getWorstHistories(page = 0, size = 10): Promise<SpringPageResponse<SearchHistoryModel>> {
    return apiClient.get<SpringPageResponse<SearchHistoryModel>>(
      `/api/v1/search-histories/admin/worst?page=${page}&size=${size}`
    );
  },

  // 검색 품질 지표 (전체 검색 수, 👍 / 👎 건수와 비율)
  getQualityStats(): Promise<SearchQualityStats> {
    return apiClient.get<SearchQualityStats>('/api/v1/search-histories/admin/stats');
  }
};
