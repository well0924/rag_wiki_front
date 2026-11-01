import { apiClient } from './apiClient';
import { SearchResponse } from '@/types/api';

export const searchApi = {
  // 권한 기반 RAG 검색 (답변 + 피드백용 historyId 반환)
  search(query: string): Promise<SearchResponse> {
    return apiClient.post<SearchResponse>('/api/v1/search', { query });
  },

  // 답변 피드백 (👍 true / 👎 false)
  sendFeedback(historyId: number, isPositive: boolean): Promise<void> {
    return apiClient.patch<void>(`/api/v1/search-histories/${historyId}/feedback`, { isPositive });
  },
};
