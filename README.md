# RAG 기반 그룹 위키 검색 에이전트 (Front)

> Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Vercel

그룹(회사 팀 · 스터디 · 개인 공간)에 문서를 올리고, 내가 속한 그룹에 공개된 문서만으로 AI에게 질문하는 위키의 웹 화면입니다.

- **데모**: 배포 후 추가 예정
- **Spring Boot 백엔드**: [rag_wiki_project_backend](https://github.com/well0924/rag_wiki_project_backend)
- **Python FastAPI AI 서버**: [rag_wiki_project_backend_ai](https://github.com/well0924/rag_wiki_project_backend_ai)

---

## 화면

| 경로 | 화면 | 내용 |
|---|---|---|
| `/login`, `/signup` | 로그인 · 회원가입 | 이메일 로그인, 구글 로그인 |
| `/oauth2/redirect` | 구글 로그인 처리 | URL로 받은 일회용 코드를 POST로 토큰과 교환 (토큰을 URL에 싣지 않음) |
| `/` | 홈 | 문서 업로드, 문서 목록, AI 검색, 그룹 관리로 이동 |
| `/groups` | 그룹 관리 | 그룹 생성, 멤버 목록. OWNER는 이메일로 멤버 추가 · 제외, 그룹 삭제 |
| `/documents` | 문서 업로드 | 공개할 그룹을 하나 이상 골라 업로드 (TXT, MD, PDF, DOCX) |
| `/documents/list` | 문서 목록 | 내 그룹에 공개된 문서와 처리 상태 (처리 중이면 자동 새로고침) |
| `/chat` | AI 검색 | 질문과 답변, 출처 문서와 유사도, 👍 / 👎 피드백 |
| `/history` | 검색 품질 모니터링 (관리자) | 👍 / 👎 비율, 👎 받은 답변과 참조 청크 |

---

## 구조

```
src/
├── api/          ← apiClient(토큰 첨부 · 재발급), 도메인별 API (document, member, search, history)
├── app/
│   ├── (wiki)/   ← 사용자 화면
│   ├── (admin)/  ← 관리자 화면
│   └── oauth2/   ← 구글 로그인 처리
├── component/    ← 공통 컴포넌트
└── types/        ← 백엔드 응답 타입
```

---

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

| 환경변수 | 기본값 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:89` | Spring Boot API 주소. 배포 시 Vercel 환경변수로 HTTPS 도메인을 지정 |

> `NEXT_PUBLIC_`으로 시작하는 값은 브라우저에 그대로 노출되므로 API 주소 외의 비밀 값은 넣지 않습니다.
