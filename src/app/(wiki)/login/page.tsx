'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiError, BASE_URL } from '@/api/apiClient';
import { memberApi } from '@/api/memberApi';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // 구글 로그인 실패(허용되지 않은 도메인, 만료된 로그인 코드 등) 시 백엔드/리다이렉트 페이지가 넘겨준 사유
  const oauthErrorMsg = searchParams.get('error') ? searchParams.get('message') : null;
  const displayedError = errorMsg || oauthErrorMsg;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      // 로그인 성공 시 memberApi 가 토큰을 localStorage 에 저장
      await memberApi.login({
        email: email.trim(),
        password: password
      });

      // 메인 화면으로 이동
       window.location.href = '/';
    } catch (err) {
      if (err instanceof ApiError) {
        // 백엔드가 내려준 실패 사유 표시 (존재하지 않는 회원, 비밀번호 불일치 등)
        setErrorMsg(err.message);
      } else {
        setErrorMsg('서버와 통신 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
        
        {/* 타이틀 헤더 */}
        <div className="text-center space-y-1.5">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">🏢 사내 지식 위키 로그인</h1>
          <p className="text-xs md:text-sm text-slate-500">
            인증 완료 후 부서별 권한에 맞는 RAG 검색 라우트를 활성화합니다.
          </p>
        </div>

        {displayedError && (
          <div className="p-3.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
            ⚠️ {displayedError}
          </div>
        )}

        {/* 메인 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">사내 이메일 계정</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="username@company.com"
              required
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition shadow-sm"
          >
            {isLoading ? '스프링 시큐리티 토큰 발행 중...' : '인증 및 로그인'}
          </button>
        </form>

        {/* 구분선 */}
        <div className="relative flex py-2 items-center text-xs text-slate-400">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink mx-4 font-medium">또는 소셜 계정 인증</span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        {/* 구글 소셜 로그인 버튼 */}
        <button
          type="button"
          onClick={() => window.location.href = `${BASE_URL}/oauth2/authorization/google`}
          className="w-full py-2.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2 shadow-sm"
        >
          <span className="text-base">🌐</span> Google 계정으로 로그인
        </button>

        {/* 회원가입 유도 */}
        <p className="text-center text-xs text-slate-500">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
            여기서 부서 권한 등록하기
          </Link>
        </p>

      </div>
    </div>
  );
}

// useSearchParams 를 쓰는 클라이언트 컴포넌트는 Suspense 로 감싸야 빌드 에러가 나지 않음
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-slate-50" />}>
      <LoginForm />
    </Suspense>
  );
}
