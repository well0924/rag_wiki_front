// AI 인덱싱 상태 열거형 (DocumentStatus 대응)
export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// 위키 문서 도메인 규격 (DocumentModel 대응)
export interface DocumentModel {
  id: number;
  title: string;
  contentUrl: string;
  docType: string;
  fileSize: number;
  status: DocumentStatus;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// 결함 사유 열거형
export type UnresolvedReason = 'HALLUCINATION' | 'PERMISSION_DENIED' | 'MISSING_INFO';

// 검색 히스토리 도메인 규격 (SearchHistoryModel 대응)
export interface SearchHistoryModel {
  historyId: number;
  memberId: number;
  query: string;
  aiAnswer: string;
  isPositive: boolean | null; // 추천(true), 비추천(false), 미평가(null)
  unresolvedReason: UnresolvedReason | null;
  referencedDocuments: string[]; // PostgreSQL text[] 컬럼 값
  createdAt: string;
}

export interface UploadSuccessResponse {
  success: boolean;
  documentId: number; // 요청 1건 = 파일 1개
  message: string;
}

// RAG 검색 응답 (SearchResponse 대응)
export interface SearchResponse {
  historyId: number;
  answer: string;
  referencedChunkIds: string[];
  sources: SearchSource[];     // 답변 근거 문서 (답변 속 [n] 번호 = n번째 출처, 비어 있으면 근거 없음)
}

export interface SearchSource {
  documentId: number;
  title: string;
  similarity: number;          // 질문과의 코사인 유사도 (0~1)
}
