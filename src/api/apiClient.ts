import { TokenResponse } from "@/types/member";

// 백엔드 공통 예외 바디 포맷 정의
interface BackendErrorBody {
  message?: string;
  errorCode?: string;
}

export class ApiError extends Error {
  status: number;
  errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:89';

const getAuthHeader = (): Record<string, string> => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) return { 'Authorization': `Bearer ${token}` };
  }
  return {};
};

const clearSessionAndRedirect = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
};

// 동시에 여러 요청이 401을 받아도 재발급은 한 번만 수행하도록 진행 중인 요청을 공유
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    // 백엔드는 Refresh Token 을 X-Refresh-Token 헤더로 받음
    const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/reissue`, {
      method: 'POST',
      headers: { 'X-Refresh-Token': refreshToken },
    });
    if (!refreshRes.ok) return false;

    const newTokens = (await refreshRes.json()) as TokenResponse;
    localStorage.setItem('accessToken', newTokens.accessToken);
    localStorage.setItem('refreshToken', newTokens.refreshToken);
    return true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// 401이 감지되면 토큰 재발급 후 원래 요청을 딱 한 번만 재시도 (무한 재시도 방지)
// - 로그인/회원가입 등 인증 API의 401은 "자격 증명 불일치"이므로 재발급 대상에서 제외
async function request<T>(url: string, makeRequest: () => Promise<Response>): Promise<T> {
  let res = await makeRequest();

  if (res.status === 401 && typeof window !== 'undefined' && !url.startsWith('/api/v1/auth/')) {
    const refreshed = await refreshOnce();
    if (!refreshed) {
      clearSessionAndRedirect();
      throw new ApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
    }
    res = await makeRequest();
  }

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as BackendErrorBody;
    throw new ApiError(
      errBody.message || '서버 통신 중 에러가 발생했습니다.',
      res.status,
      errBody.errorCode
    );
  }

  // 204 No Content 등 바디가 없는 응답 대응
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

const jsonRequest = <T>(method: string, url: string, body?: Record<string, unknown>) =>
  request<T>(url, () =>
    fetch(`${BASE_URL}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  );

export const apiClient = {
  get<T>(url: string): Promise<T> {
    return jsonRequest<T>('GET', url);
  },

  post<T>(url: string, body: BodyInit | Record<string, unknown>, isMultipart = false): Promise<T> {
    if (!isMultipart) {
      return jsonRequest<T>('POST', url, body as Record<string, unknown>);
    }
    // 멀티파트는 브라우저가 boundary 포함 Content-Type을 직접 설정해야 하므로 헤더 생략
    return request<T>(url, () =>
      fetch(`${BASE_URL}${url}`, { method: 'POST', headers: { ...getAuthHeader() }, body: body as BodyInit })
    );
  },

  put<T>(url: string, body: Record<string, unknown>): Promise<T> {
    return jsonRequest<T>('PUT', url, body);
  },

  patch<T>(url: string, body: Record<string, unknown>): Promise<T> {
    return jsonRequest<T>('PATCH', url, body);
  },

  delete<T>(url: string): Promise<T> {
    return request<T>(url, () =>
      fetch(`${BASE_URL}${url}`, { method: 'DELETE', headers: { ...getAuthHeader() } })
    );
  },
};
