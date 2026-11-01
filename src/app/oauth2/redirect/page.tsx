'line spacing: 1.25';
'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/api/apiClient';
import { memberApi } from '@/api/memberApi';

function OAuth2RedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 코드는 1회용이므로 개발 모드(StrictMode)의 effect 이중 실행에도 교환은 한 번만 요청
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    // 백엔드는 토큰 대신 30초짜리 일회용 코드만 URL로 전달 (토큰이 브라우저 기록 / 로그에 남지 않도록)
    const code = searchParams.get('code');
    const fail = (message: string) =>
      router.replace(`/login?error=true&message=${encodeURIComponent(message)}`);

    if (!code) {
      fail('로그인 코드가 누락되었습니다. 다시 시도해 주세요.');
      return;
    }

    memberApi
      .exchangeOAuth2Code(code)
      // 주소창에 코드가 남지 않도록 replace 로 이동
      .then(() => router.replace('/'))
      .catch((err) => fail(err instanceof ApiError ? err.message : '서버와 통신 중 오류가 발생했습니다.'));
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-3">
        {/* 로딩 스피너 */}
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">OAuth2 보안 세션 수립 중</h2>
        <p className="text-xs text-slate-400">일회용 로그인 코드를 액세스 토큰으로 교환하고 있습니다...</p>
      </div>
    </div>
  );
}

// Next.js 규칙: useSearchParams가 붙은 클라이언트 컴포넌트는 반드시 Suspense로 감싸야 빌드 에러가 안 남
export default function OAuth2RedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <OAuth2RedirectHandler />
    </Suspense>
  );
}
