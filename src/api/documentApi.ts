'line spacing: 1.25';

import { apiClient } from './apiClient';
import { DocumentModel, UploadSuccessResponse } from '@/types/api';

export const documentApi = {
  // 1. 위키 파일 멀티파트 업로드
  uploadDocument(formData: FormData): Promise<UploadSuccessResponse> {
    return apiClient.post<UploadSuccessResponse>('/api/v1/documents/upload', formData, true);
  },

  // 2. 접근 가능한 위키 문서 목록 전체 조회
  getAccessibleDocuments(): Promise<DocumentModel[]> {
    return apiClient.get<DocumentModel[]>('/api/v1/documents');
  },

  // 3. 문서 삭제 (작성자 본인 또는 관리자)
  deleteDocument(documentId: number): Promise<void> {
    return apiClient.delete<void>(`/api/v1/documents/${documentId}`);
  }
};