// 관리자 검색 품질 지표 (GET /api/v1/search-histories/admin/stats)
// 비율은 👍/👎를 남긴 기록만 분모로 계산하며, 피드백이 없으면 null
export interface SearchQualityStats {
  totalSearches: number;
  positiveCount: number;
  negativeCount: number;
  feedbackCount: number;
  positiveRate: number | null;
  negativeRate: number | null;
}

// (미사용) 예전 대시보드 시안용 DTO. component/admin/MetricCardsRow.tsx에서만 참조
export interface SearchQualityMetrics {
  totalQueryCount: number;
  positiveFeedbackRate: number; // 👍 비율 (ex: 91.4)
  negativeFeedbackRate: number; // 👎 비율 (ex: 8.6)
}

// 2. 품질 저하(👎) 검색 기록 DTO
export interface WorstSearchHistory {
  historyId: number;
  createdAt: string;       // LocalDateTime -> ISO String 매핑
  maskedUserEmail: string; // 마스킹된 이메일 (예: jo***@company.com)
  query: string;           // 사용자 질문
  aiAnswer: string;        // 👎 를 받은 AI 답변
  unresolvedReason: 'HALLUCINATION' | 'PERMISSION_DENIED' | 'MISSING_INFO'; // 품질 결함 분류 Enum
  referencedDocuments: string[]; // 참조 문서 (PostgreSQL text[] 컬럼, 예: ["HR_규정.md"])
}

export interface SearchHistoryModel {
  id: number;
  memberId: number;
  query: string;
  answer: string | null;           
  referencedChunkIds: string[];    
  feedback: boolean | null;         // 추천(true), 비추천(false), 미선택(null)
  createdAt: string;                // LocalDateTime -> ISO String 파싱용
  userEmail?: string;               // 선택 필드
}

export interface SpringPageResponse<T> {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}